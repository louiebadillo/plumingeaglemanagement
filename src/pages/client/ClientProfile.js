import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Restaurant as RestaurantIcon,
  Sports as SportsIcon,
  Notes as NotesIcon,
  ContactEmergency as EmergencyIcon,
  CalendarToday as CalendarIcon,
  Room as RoomIcon,
  PhotoCamera as PhotoCameraIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  Link as LinkIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { formatDate, calculateAge } from '../../context/clientMock';
import { useSupabase } from '../../context/SupabaseContext';
import { parseClientSlug, createClientUrl } from '../../utils/urlUtils';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import SocialMediaManager from '../../components/Client/SocialMediaManager';
import AllowedContactsManager from '../../components/Client/AllowedContactsManager';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';

function ClientProfile() {
  const { clientSlug } = useParams();
  const history = useHistory();
  const location = useLocation();
  const [client, setClient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState({});
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [facility, setFacility] = useState(null);
  const [facilityFromUrl, setFacilityFromUrl] = useState(null);
  const [facilitySelectionOpen, setFacilitySelectionOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  
  const { userProfile } = useSupabase();
  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';
  // Check if this is a new client - check the URL path first (most reliable)
  // When using exact route, clientSlug might be undefined, so check pathname
  const isNewClient = !clientSlug || clientSlug === 'new' || window.location.pathname === '/app/client/new' || window.location.pathname.endsWith('/client/new');

  // Helper function to load facility information
  const loadFacilityInfo = async (facilityId) => {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      const facilityResponse = await fetch(`${supabaseUrl}/rest/v1/facilities?id=eq.${facilityId}`, {
        method: 'GET',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (facilityResponse.ok) {
        const facilityData = await facilityResponse.json();
        if (facilityData && facilityData.length > 0) {
          setFacility(facilityData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading facility:', error);
    }
  };

  // Helper function to load all facilities for selection
  const loadFacilities = async () => {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      const facilitiesResponse = await fetch(`${supabaseUrl}/rest/v1/facilities?select=*&order=name.asc`, {
        method: 'GET',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json();
        setFacilities(facilitiesData || []);
        return facilitiesData || [];
      }
      return [];
      } catch (error) {
      console.error('Error loading facilities:', error);
      return [];
    }
  };

  // Handle facility selection from questionnaire
  const handleFacilitySelection = () => {
    if (!selectedFacilityId) {
      alert('Please select a facility');
      return;
    }
    
    console.log('✅ Facility selected:', selectedFacilityId);
    // Close dialog first
    setFacilitySelectionOpen(false);
    // Update URL with facility parameter - this will trigger useEffect to run again
    const newUrl = `/app/client/new?facility=${selectedFacilityId}`;
    console.log('🚀 Navigating to:', newUrl);
    history.push(newUrl);
    setFacilityFromUrl(selectedFacilityId);
    // The useEffect will run again with the facility parameter
  };

  useEffect(() => {
    // Read URL parameters when component mounts or URL changes
    const urlParams = new URLSearchParams(window.location.search);
    const facilityParam = urlParams.get('facility');
    setFacilityFromUrl(facilityParam);
    
    const currentPath = window.location.pathname;
    console.log('🔍 ClientProfile useEffect:', { clientSlug, isNewClient, pathname: currentPath, facilityParam, facilitySelectionOpen });
    
    // Early return if this is a new client - don't try to load from database
    // Check both the slug and the pathname to be absolutely sure
    // When exact route matches, clientSlug is undefined, so check pathname
    const isCreatingNewClient = currentPath === '/app/client/new' || 
                                 currentPath.endsWith('/client/new') || 
                                 clientSlug === 'new' || 
                                 !clientSlug;
    
    if (isCreatingNewClient) {
      console.log('✅ Creating new client - pathname:', currentPath, 'clientSlug:', clientSlug);
      
      // If no facility parameter, show facility selection dialog first
      if (!facilityParam) {
        console.log('📋 No facility parameter - showing facility selection dialog');
        // Set dialog open immediately, then load facilities
        setFacilitySelectionOpen(true);
        // Load facilities list for selection
        loadFacilities().then(() => {
          console.log('✅ Facilities loaded');
        }).catch((error) => {
          console.error('❌ Error loading facilities:', error);
        });
        // Don't initialize client yet - wait for facility selection
        return;
      }
      
      // If facility selection dialog was open, close it now that we have a facility
      if (facilitySelectionOpen) {
        console.log('✅ Facility selected, closing dialog and initializing client');
        setFacilitySelectionOpen(false);
      }
      
      // Load facility info if facility ID is provided
      if (facilityParam) {
        loadFacilityInfo(facilityParam);
      }
      // Initialize empty client for new client creation
      const newClient = {
        id: null,
        firstName: '',
        lastName: '',
        gender: '',
        age: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        albertaHealthCardNumber: '',
        client_id_no: '',
        band_no: '',
        admissionDate: '',
        room: '',
        pronouns: '',
        socialMediaLinks: [],
        caseWorker: {
          name: '',
          phone: '',
          agency: '',
          agencyOfficeNumber: '',
          onCallNumber: ''
        },
        physicalAttributes: {
          hairColour: '',
          eyeColour: '',
          height: '',
          weight: '',
          build: '',
          bodyMarks: ''
        },
        schoolInfo: {
          albertaStudentNumber: '',
          schoolName: '',
          grade: '',
          teacher: '',
          schoolAddress: '',
          schoolPhone: ''
        },
        medicalNotes: '',
        allergies: '',
        diagnosis: '',
        familyDoctor: '',
        dentist: '',
        optometrist: '',
        specialist: '',
        pediatrician: '',
        allowedContacts: [],
        risksAndPreferences: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        secondaryEmergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        facility: facilityParam || null, // Use facility from URL or null
        status: 'Active',
        assignedStaff: [],
        lastUpdated: new Date().toISOString()
      };
      // Set client and editing client immediately
      setClient(newClient);
      setEditingClient(newClient);
      // Open edit dialog immediately for new client
      setTimeout(() => {
        setEditDialogOpen(true);
      }, 100);
      return; // Exit early, don't try to load from database
    }
    
    // Only try to load existing client if we're not creating a new one
    const currentPathForLoad = window.location.pathname;
    const shouldLoadExistingClient = clientSlug && 
                                     clientSlug !== 'new' && 
                                     !isNewClient && 
                                     currentPathForLoad !== '/app/client/new' &&
                                     !currentPathForLoad.endsWith('/client/new');
    
    if (shouldLoadExistingClient) {
      console.log('📂 Loading existing client:', clientSlug);
      // Load existing client from Supabase
      const loadClient = async () => {
        try {
          const { supabaseUrl } = getSupabaseConfig();
          let supabaseClient = null;
          
          // Check if clientSlug is a UUID (client ID)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isClientId = uuidRegex.test(clientSlug);
          
          if (isClientId) {
            // Load client directly by ID
            const response = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientSlug}&select=*`, {
              method: 'GET',
              headers: {
                ...getSupabaseHeaders(),
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.length > 0) {
              supabaseClient = data[0];
            }
          } else {
            // Fall back to name-based lookup for backward compatibility
            const nameParts = clientSlug.split('-');
          let foundClient = null;
          
            // Try different combinations of first/last name splits
          for (let i = 1; i < nameParts.length; i++) {
            const firstNameParts = nameParts.slice(0, i);
            const lastNameParts = nameParts.slice(i);
            
            const firstName = firstNameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
            const lastName = lastNameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
            
            // Properly encode the names for the Supabase query
            const encodedFirstName = encodeURIComponent(firstName);
            const encodedLastName = encodeURIComponent(lastName);
              const queryUrl = `${supabaseUrl}/rest/v1/clients?first_name=eq.${encodedFirstName}&last_name=eq.${encodedLastName}&select=*`;
            
            const response = await fetch(queryUrl, {
              method: 'GET',
              headers: {
                ...getSupabaseHeaders(),
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
              foundClient = data[0];
              break;
            }
          }
          
          if (foundClient) {
              supabaseClient = foundClient;
            }
          }
          
          if (supabaseClient) {
            
            // Load facility information using the client's facility_id
            if (supabaseClient.facility_id) {
              loadFacilityInfo(supabaseClient.facility_id);
            }
            
            // Transform Supabase data to match the expected client structure
            const transformedClient = {
              id: supabaseClient.id,
              firstName: supabaseClient.first_name,
              lastName: supabaseClient.last_name,
              gender: supabaseClient.gender,
              age: supabaseClient.date_of_birth ? calculateAge(supabaseClient.date_of_birth) : '',
              dateOfBirth: supabaseClient.date_of_birth,
              phone: supabaseClient.phone,
              email: supabaseClient.email,
              address: supabaseClient.address,
              albertaHealthCardNumber: supabaseClient.alberta_health_card_number,
              client_id_no: supabaseClient.client_id_no,
              band_no: supabaseClient.band_no,
              admissionDate: supabaseClient.admission_date,
              room: supabaseClient.room,
              pronouns: supabaseClient.pronouns,
              socialMediaLinks: supabaseClient.social_media_links || [],
              caseWorker: {
                name: supabaseClient.case_worker_name,
                phone: supabaseClient.case_worker_phone,
                agency: supabaseClient.case_worker_agency,
                agencyOfficeNumber: supabaseClient.case_worker_agency_office_number,
                onCallNumber: supabaseClient.case_worker_on_call_number
              },
              physicalAttributes: {
                hairColour: supabaseClient.hair_colour,
                eyeColour: supabaseClient.eye_colour,
                height: supabaseClient.height,
                weight: supabaseClient.weight,
                build: supabaseClient.build,
                bodyMarks: supabaseClient.body_marks
              },
              schoolInfo: {
                albertaStudentNumber: supabaseClient.alberta_student_number,
                schoolName: supabaseClient.school_name,
                grade: supabaseClient.grade,
                teacher: supabaseClient.teacher,
                schoolAddress: supabaseClient.school_address,
                schoolPhone: supabaseClient.school_phone
              },
              medicalNotes: supabaseClient.medical_notes,
              allergies: supabaseClient.allergies,
              diagnosis: supabaseClient.diagnosis,
              familyDoctor: supabaseClient.family_doctor,
              dentist: supabaseClient.dentist,
              optometrist: supabaseClient.optometrist,
              specialist: supabaseClient.specialist,
              pediatrician: supabaseClient.pediatrician,
              allowedContacts: supabaseClient.allowed_contacts || [],
              risksAndPreferences: supabaseClient.risks_and_preferences,
              // Keep old fields for backward compatibility but don't use in UI
              dietaryRestrictions: supabaseClient.dietary_restrictions,
              activityPreferences: supabaseClient.activity_preferences,
              otherPreferences: supabaseClient.other_preferences,
              emergencyContact: {
                name: supabaseClient.emergency_contact_name,
                relationship: supabaseClient.emergency_contact_relationship,
                phone: supabaseClient.emergency_contact_phone,
                email: supabaseClient.emergency_contact_email
              },
              secondaryEmergencyContact: {
                name: supabaseClient.secondary_emergency_contact_name,
                relationship: supabaseClient.secondary_emergency_contact_relationship,
                phone: supabaseClient.secondary_emergency_contact_phone,
                email: supabaseClient.secondary_emergency_contact_email
              },
              facility: supabaseClient.facility_id,
              status: 'Active',
              assignedStaff: [],
              lastUpdated: supabaseClient.updated_at
            };
            
            setClient(transformedClient);
            setEditingClient(transformedClient);
          } else {
            // Only redirect if we're not trying to create a new client
            if (clientSlug !== 'new' && !isNewClient) {
            // Redirect to facility management if client not found
            history.push('/app/facility/management');
            }
          }
        } catch (error) {
          console.error('💥 Error loading client from Supabase:', error);
          // Only redirect if we're not trying to create a new client
          if (clientSlug !== 'new' && !isNewClient) {
          // Redirect to facility management on error
          history.push('/app/facility/management');
          }
        }
      };
      
      loadClient();
    }
  }, [clientSlug, history, isNewClient, location.search]);

  // Handle tab parameter to scroll to files section
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'files' && client) {
      // Scroll to the files section after a short delay to ensure it's rendered
      setTimeout(() => {
        const filesSection = document.getElementById('client-files-section');
        if (filesSection) {
          filesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [client]);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  // Helper function to convert empty strings to null for date fields
  const cleanDateField = (value) => {
    if (!value || value === '' || value.trim() === '') {
      return null;
    }
    return value;
  };

  const handleSaveEdit = async () => {
    try {
      console.log('💾 Saving client:', editingClient);
      
      if (isNewClient) {
        // Create new client in Supabase
        const clientData = {
          first_name: editingClient.firstName,
          last_name: editingClient.lastName,
          gender: editingClient.gender,
          date_of_birth: cleanDateField(editingClient.dateOfBirth),
          phone: editingClient.phone,
          email: editingClient.email,
          address: editingClient.address,
          alberta_health_card_number: editingClient.albertaHealthCardNumber,
          client_id_no: editingClient.client_id_no,
          band_no: editingClient.band_no,
          admission_date: cleanDateField(editingClient.admissionDate),
          room: editingClient.room,
          pronouns: editingClient.pronouns,
          social_media_links: editingClient.socialMediaLinks || [],
          case_worker_name: editingClient.caseWorker?.name,
          case_worker_phone: editingClient.caseWorker?.phone,
          case_worker_agency: editingClient.caseWorker?.agency,
          case_worker_agency_office_number: editingClient.caseWorker?.agencyOfficeNumber,
          case_worker_on_call_number: editingClient.caseWorker?.onCallNumber,
          hair_colour: editingClient.physicalAttributes?.hairColour,
          eye_colour: editingClient.physicalAttributes?.eyeColour,
          height: editingClient.physicalAttributes?.height,
          weight: editingClient.physicalAttributes?.weight,
          build: editingClient.physicalAttributes?.build,
          body_marks: editingClient.physicalAttributes?.bodyMarks,
          alberta_student_number: editingClient.schoolInfo?.albertaStudentNumber,
          school_name: editingClient.schoolInfo?.schoolName,
          grade: editingClient.schoolInfo?.grade,
          teacher: editingClient.schoolInfo?.teacher,
          school_address: editingClient.schoolInfo?.schoolAddress,
          school_phone: editingClient.schoolInfo?.schoolPhone,
          medical_notes: editingClient.medicalNotes,
          allergies: editingClient.allergies,
          diagnosis: editingClient.diagnosis,
          family_doctor: editingClient.familyDoctor,
          dentist: editingClient.dentist,
          optometrist: editingClient.optometrist,
          specialist: editingClient.specialist,
          pediatrician: editingClient.pediatrician,
          allowed_contacts: editingClient.allowedContacts || [],
          risks_and_preferences: editingClient.risksAndPreferences,
          facility_id: facilityFromUrl || editingClient.facility // Use the facility ID from URL or from editingClient
        };
        
        console.log('🆕 Creating new client with data:', clientData);
        
        const response = await fetch('https://brkbypctkcczerntfpsa.supabase.co/rest/v1/clients', {
          method: 'POST',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(clientData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Supabase error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const newClient = await response.json();
        console.log('✅ Client created successfully:', newClient);
        
        setEditDialogOpen(false);
        // Show success modal before redirecting
        setSuccessMessage(`Client "${editingClient.firstName} ${editingClient.lastName}" has been created successfully.`);
        setSuccessModalOpen(true);
        // Redirect to the new client's profile page after a short delay
        setTimeout(() => {
          const clientUrl = createClientUrl(newClient[0]);
          history.push(clientUrl);
        }, 1500);
      } else {
        // Update existing client in Supabase
        const clientData = {
          first_name: editingClient.firstName,
          last_name: editingClient.lastName,
          gender: editingClient.gender,
          date_of_birth: cleanDateField(editingClient.dateOfBirth),
          phone: editingClient.phone,
          email: editingClient.email,
          address: editingClient.address,
          alberta_health_card_number: editingClient.albertaHealthCardNumber,
          client_id_no: editingClient.client_id_no,
          band_no: editingClient.band_no,
          admission_date: cleanDateField(editingClient.admissionDate),
          room: editingClient.room,
          pronouns: editingClient.pronouns,
          social_media_links: editingClient.socialMediaLinks || [],
          case_worker_name: editingClient.caseWorker?.name,
          case_worker_phone: editingClient.caseWorker?.phone,
          case_worker_agency: editingClient.caseWorker?.agency,
          case_worker_agency_office_number: editingClient.caseWorker?.agencyOfficeNumber,
          case_worker_on_call_number: editingClient.caseWorker?.onCallNumber,
          hair_colour: editingClient.physicalAttributes?.hairColour,
          eye_colour: editingClient.physicalAttributes?.eyeColour,
          height: editingClient.physicalAttributes?.height,
          weight: editingClient.physicalAttributes?.weight,
          build: editingClient.physicalAttributes?.build,
          body_marks: editingClient.physicalAttributes?.bodyMarks,
          alberta_student_number: editingClient.schoolInfo?.albertaStudentNumber,
          school_name: editingClient.schoolInfo?.schoolName,
          grade: editingClient.schoolInfo?.grade,
          teacher: editingClient.schoolInfo?.teacher,
          school_address: editingClient.schoolInfo?.schoolAddress,
          school_phone: editingClient.schoolInfo?.schoolPhone,
          medical_notes: editingClient.medicalNotes,
          allergies: editingClient.allergies,
          diagnosis: editingClient.diagnosis,
          family_doctor: editingClient.familyDoctor,
          dentist: editingClient.dentist,
          optometrist: editingClient.optometrist,
          specialist: editingClient.specialist,
          pediatrician: editingClient.pediatrician,
          allowed_contacts: editingClient.allowedContacts || [],
          risks_and_preferences: editingClient.risksAndPreferences
        };
        
        console.log('🔄 Updating client with data:', clientData);
        
        const response = await fetch(`https://brkbypctkcczerntfpsa.supabase.co/rest/v1/clients?id=eq.${client.id}`, {
          method: 'PATCH',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(clientData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Supabase error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        console.log('✅ Client updated successfully');
        setClient(editingClient);
        setEditDialogOpen(false);
        setSuccessMessage(`Client "${editingClient.firstName} ${editingClient.lastName}" information has been updated successfully.`);
        setSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('💥 Error saving client:', error);
      alert(`Error saving client: ${error.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!client) return;

    try {
      setDeleting(true);
      console.log('Deleting client:', client.id);
      
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${client.id}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const clientName = `${client.firstName} ${client.lastName}`;
      const facilityId = client.facility;
      
      // Close delete dialog and show success
      setDeleteDialogOpen(false);
      setSuccessMessage(`Client "${clientName}" has been deleted successfully.`);
      setSuccessModalOpen(true);
      
      // Redirect back to facility after a short delay
      setTimeout(() => {
        history.push(`/app/facility/${facilityId}`);
      }, 1500);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(`Error deleting client: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleSecondaryEmergencyContactChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      secondaryEmergencyContact: {
        ...prev.secondaryEmergencyContact,
        [field]: value
      }
    }));
  };


  // Check if we're creating a new client - use pathname as the most reliable check
  const pathname = window.location.pathname;
  const isCreatingNew = pathname === '/app/client/new' || pathname.endsWith('/client/new') || clientSlug === 'new' || !clientSlug;
  
  // Check if we're waiting for facility selection
  const urlParams = new URLSearchParams(window.location.search);
  const facilityParam = urlParams.get('facility');
  const waitingForFacility = isCreatingNew && !facilityParam && !client;
  
  // Show loading only if we're not creating a new client and not waiting for facility selection
  if (!client && !isCreatingNew) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading client information...</Typography>
      </Box>
    );
  }
  
  // For new clients waiting for facility selection, show nothing (dialog will handle it)
  // For new clients with facility, show loading briefly
  if (isCreatingNew && !client && !waitingForFacility) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Preparing client form...</Typography>
      </Box>
    );
  }
  
  // If waiting for facility selection, show loading while facilities are being loaded
  // The dialog will be shown once facilities are loaded and state is set
  if (waitingForFacility && !facilitySelectionOpen) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading facilities...</Typography>
      </Box>
    );
  }

  // If facility selection dialog is open, render only the dialog
  // Don't render the main component content
  if (facilitySelectionOpen) {
    return (
      <Box sx={{ p: 3 }}>
        <Dialog open={facilitySelectionOpen} onClose={() => {
          setFacilitySelectionOpen(false);
          // Navigate back if user cancels
          history.push('/app/client/masterlist');
        }} maxWidth="sm" fullWidth>
          <DialogTitle>Select Facility</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Please select which facility this client will be assigned to:
              </Typography>
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Facility</InputLabel>
                <Select
                  value={selectedFacilityId || ''}
                  label="Facility"
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                >
                  {facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.name}
                      {facility.address && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          - {facility.address}
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setFacilitySelectionOpen(false);
              history.push('/app/client/masterlist');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleFacilitySelection} 
              variant="contained"
              disabled={!selectedFacilityId}
            >
              Proceed
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Don't render main component if client is null (unless it's a new client with facility)
  if (!client && !isCreatingNew) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading client information...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
            src={client?.profilePhoto}
          >
            {client?.firstName?.[0]}{client?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {client?.firstName} {client?.lastName}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="textSecondary">
                Room {client?.room || 'Not assigned'} • {facility?.name || 'Facility not found'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {isAdmin && (
          <Box>
            <IconButton onClick={handleEdit} color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            {!isNewClient && (
              <IconButton onClick={handleDelete} color="error">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Age" 
                    secondary={`${calculateAge(client.dateOfBirth)} years old`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Date of Birth" 
                    secondary={formatDate(client.dateOfBirth)} 
                  />
                </ListItem>
                {client.pronouns && (
                  <ListItem>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Pronouns" 
                      secondary={client.pronouns} 
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={client.phone || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={client.email || 'Not provided'} 
                  />
                </ListItem>
                {client.albertaHealthCardNumber && (
                <ListItem>
                    <ListItemIcon><MedicalIcon /></ListItemIcon>
                  <ListItemText 
                      primary="Alberta Health Number" 
                      secondary={client.albertaHealthCardNumber} 
                  />
                </ListItem>
                )}
                {client.client_id_no && (
                  <ListItem>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Client ID No" 
                      secondary={client.client_id_no} 
                    />
                  </ListItem>
                )}
                {client.band_no && (
                  <ListItem>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Band No" 
                      secondary={client.band_no} 
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon><RoomIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Admission Date" 
                    secondary={formatDate(client.admissionDate)} 
                  />
                </ListItem>
                {client.socialMediaLinks && client.socialMediaLinks.length > 0 && (
                  <ListItem>
                    <ListItemIcon><LinkIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Social Media Links" 
                      secondary={`${client.socialMediaLinks.length} link(s)`} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Case Worker Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Worker Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Name" 
                    secondary={client.caseWorker?.name || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={client.caseWorker?.phone || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><HomeIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Agency" 
                    secondary={client.caseWorker?.agency || 'Not provided'} 
                  />
                </ListItem>
                    <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                    primary="Agency Office Number" 
                    secondary={client.caseWorker?.agencyOfficeNumber || 'Not provided'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="On-Call Number" 
                    secondary={client.caseWorker?.onCallNumber || 'Not provided'} 
                  />
                    </ListItem>
                  </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Physical Attributes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonOutlineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Physical Attributes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Hair Colour" 
                    secondary={client.physicalAttributes?.hairColour || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Eye Colour" 
                    secondary={client.physicalAttributes?.eyeColour || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Height" 
                    secondary={client.physicalAttributes?.height || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Weight" 
                    secondary={client.physicalAttributes?.weight || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Build" 
                    secondary={client.physicalAttributes?.build || 'Not provided'} 
                  />
                </ListItem>
                {client.physicalAttributes?.bodyMarks && (
                  <ListItem>
                    <ListItemText 
                      primary="Body Marks" 
                      secondary={client.physicalAttributes.bodyMarks} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* School Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                School Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                {client.schoolInfo?.albertaStudentNumber && (
                  <ListItem>
                    <ListItemText 
                      primary="Alberta Student Number" 
                      secondary={client.schoolInfo.albertaStudentNumber} 
                    />
                    </ListItem>
                )}
                <ListItem>
                  <ListItemText 
                    primary="School Name" 
                    secondary={client.schoolInfo?.schoolName || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Grade" 
                    secondary={client.schoolInfo?.grade || 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Teacher" 
                    secondary={client.schoolInfo?.teacher || 'Not provided'} 
                  />
                </ListItem>
                {client.schoolInfo?.schoolAddress && (
                  <ListItem>
                    <ListItemIcon><RoomIcon /></ListItemIcon>
                    <ListItemText 
                      primary="School Address" 
                      secondary={client.schoolInfo.schoolAddress} 
                    />
                  </ListItem>
                )}
                {client.schoolInfo?.schoolPhone && (
                  <ListItem>
                    <ListItemIcon><PhoneIcon /></ListItemIcon>
                    <ListItemText 
                      primary="School Phone" 
                      secondary={client.schoolInfo.schoolPhone} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
      </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Medical Information
          </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                {client.allergies && (
                  <ListItem>
                    <ListItemText 
                      primary="Allergies" 
                      secondary={client.allergies} 
                    />
                  </ListItem>
                )}
                {client.diagnosis && (
                  <ListItem>
                    <ListItemText 
                      primary="Diagnosis" 
                      secondary={client.diagnosis} 
                    />
                  </ListItem>
                )}
                {client.familyDoctor && (
                  <ListItem>
                    <ListItemText 
                      primary="Family Doctor" 
                      secondary={client.familyDoctor} 
                    />
                  </ListItem>
                )}
                {client.dentist && (
                  <ListItem>
                    <ListItemText 
                      primary="Dentist" 
                      secondary={client.dentist} 
                    />
                  </ListItem>
                )}
                {client.optometrist && (
                  <ListItem>
                    <ListItemText 
                      primary="Optometrist" 
                      secondary={client.optometrist} 
                    />
                  </ListItem>
                )}
                {client.specialist && (
                  <ListItem>
                    <ListItemText 
                      primary="Specialist" 
                      secondary={client.specialist} 
                    />
                  </ListItem>
                )}
                {client.pediatrician && (
                  <ListItem>
                    <ListItemText 
                      primary="Pediatrician" 
                      secondary={client.pediatrician} 
                    />
                  </ListItem>
                )}
                {client.medicalNotes && (
                  <ListItem>
                    <ListItemText 
                      primary="Medical Notes" 
                      secondary={client.medicalNotes} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Allowed Contacts */}
        <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Allowed Contacts
                    </Typography>
              <Divider sx={{ mb: 2 }} />
              <AllowedContactsManager
                allowedContacts={client.allowedContacts || []}
                onUpdate={(contacts) => {
                  setEditingClient(prev => ({ ...prev, allowedContacts: contacts }));
                }}
                canEdit={isAdmin}
              />
                  </CardContent>
                </Card>
              </Grid>

        {/* Social Media Links */}
        {client.socialMediaLinks && client.socialMediaLinks.length > 0 && (
          <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                  <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Social Media Links
                    </Typography>
                <Divider sx={{ mb: 2 }} />
                <SocialMediaManager
                  socialMediaLinks={client.socialMediaLinks || []}
                  onUpdate={(links) => {
                    setEditingClient(prev => ({ ...prev, socialMediaLinks: links }));
                  }}
                  canEdit={isAdmin}
                />
                  </CardContent>
                </Card>
              </Grid>
        )}

        {/* Risks and Preferences */}
        {client.risksAndPreferences && (
          <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                  <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Risks and Preferences
                    </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {client.risksAndPreferences}
                    </Typography>
                </Paper>
                  </CardContent>
                </Card>
            </Grid>
          )}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isNewClient ? `Add New Client - ${facility?.name || 'Facility'}` : 'Edit Client Information'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editingClient.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editingClient.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={editingClient.gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pronouns"
                value={editingClient.pronouns || ''}
                onChange={(e) => handleInputChange('pronouns', e.target.value)}
                placeholder="e.g., he/him, she/her, they/them"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editingClient.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editingClient.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={editingClient.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Admission Date"
                type="date"
                value={editingClient.admissionDate || ''}
                onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room"
                value={editingClient.room || ''}
                onChange={(e) => handleInputChange('room', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alberta Health Card Number"
                value={editingClient.albertaHealthCardNumber || ''}
                onChange={(e) => handleInputChange('albertaHealthCardNumber', e.target.value)}
                placeholder="e.g., 1234-567-890"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client ID No"
                value={editingClient.client_id_no || ''}
                onChange={(e) => handleInputChange('client_id_no', e.target.value)}
                placeholder="Enter client ID number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Band No"
                value={editingClient.band_no || ''}
                onChange={(e) => handleInputChange('band_no', e.target.value)}
                placeholder="Enter band number"
              />
            </Grid>
            {/* Social Media Links */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Social Media Links</Typography>
              <SocialMediaManager
                socialMediaLinks={editingClient.socialMediaLinks || []}
                onUpdate={(links) => handleInputChange('socialMediaLinks', links)}
                canEdit={true}
              />
            </Grid>

            {/* Case Worker Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Case Worker Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Worker Name"
                value={editingClient.caseWorker?.name || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  caseWorker: { ...prev.caseWorker, name: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Worker Phone"
                value={editingClient.caseWorker?.phone || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  caseWorker: { ...prev.caseWorker, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agency"
                value={editingClient.caseWorker?.agency || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  caseWorker: { ...prev.caseWorker, agency: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agency Office Number"
                value={editingClient.caseWorker?.agencyOfficeNumber || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  caseWorker: { ...prev.caseWorker, agencyOfficeNumber: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="On-Call Number"
                value={editingClient.caseWorker?.onCallNumber || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  caseWorker: { ...prev.caseWorker, onCallNumber: e.target.value }
                }))}
              />
            </Grid>

            {/* Physical Attributes */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Physical Attributes</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hair Colour"
                value={editingClient.physicalAttributes?.hairColour || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, hairColour: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Eye Colour"
                value={editingClient.physicalAttributes?.eyeColour || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, eyeColour: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Height"
                value={editingClient.physicalAttributes?.height || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, height: e.target.value }
                }))}
                placeholder="e.g., 5'10&quot;"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight"
                value={editingClient.physicalAttributes?.weight || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, weight: e.target.value }
                }))}
                placeholder="e.g., 150 lbs"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Build"
                value={editingClient.physicalAttributes?.build || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, build: e.target.value }
                }))}
                placeholder="e.g., slim, average, stocky"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Body Marks"
                value={editingClient.physicalAttributes?.bodyMarks || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  physicalAttributes: { ...prev.physicalAttributes, bodyMarks: e.target.value }
                }))}
                placeholder="Tattoos, piercings, birthmarks, etc."
              />
            </Grid>
            
            {/* School Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>School Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                label="Alberta Student Number"
                value={editingClient.schoolInfo?.albertaStudentNumber || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, albertaStudentNumber: e.target.value }
                }))}
                  />
                </Grid>
            <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                label="School Name"
                value={editingClient.schoolInfo?.schoolName || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, schoolName: e.target.value }
                }))}
                  />
                </Grid>
            <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                label="Grade"
                value={editingClient.schoolInfo?.grade || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, grade: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teacher"
                value={editingClient.schoolInfo?.teacher || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, teacher: e.target.value }
                }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                label="School Address"
                value={editingClient.schoolInfo?.schoolAddress || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, schoolAddress: e.target.value }
                }))}
                  />
                </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Phone"
                value={editingClient.schoolInfo?.schoolPhone || ''}
                onChange={(e) => setEditingClient(prev => ({
                  ...prev,
                  schoolInfo: { ...prev.schoolInfo, schoolPhone: e.target.value }
                }))}
              />
            </Grid>
            
            {/* Medical Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Medical Information</Typography>
            </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                multiline
                rows={2}
                label="Allergies"
                value={editingClient.allergies || ''}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                multiline
                rows={2}
                label="Diagnosis"
                value={editingClient.diagnosis || ''}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  />
                </Grid>
            <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                label="Family Doctor"
                value={editingClient.familyDoctor || ''}
                onChange={(e) => handleInputChange('familyDoctor', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dentist"
                value={editingClient.dentist || ''}
                onChange={(e) => handleInputChange('dentist', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Optometrist"
                value={editingClient.optometrist || ''}
                onChange={(e) => handleInputChange('optometrist', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Specialist (please specify)"
                value={editingClient.specialist || ''}
                onChange={(e) => handleInputChange('specialist', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pediatrician"
                value={editingClient.pediatrician || ''}
                onChange={(e) => handleInputChange('pediatrician', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                multiline
                rows={3}
                label="Medical Notes"
                value={editingClient.medicalNotes || ''}
                onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                  />
                </Grid>

            {/* Allowed Contacts */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Allowed Contacts</Typography>
              <AllowedContactsManager
                allowedContacts={editingClient.allowedContacts || []}
                onUpdate={(contacts) => handleInputChange('allowedContacts', contacts)}
                canEdit={true}
              />
              </Grid>

            {/* Risks and Preferences */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Risks and Preferences</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Risks and Preferences"
                value={editingClient.risksAndPreferences || ''}
                onChange={(e) => handleInputChange('risksAndPreferences', e.target.value)}
                placeholder="Enter risks and preferences information..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            {isNewClient ? 'Create Client' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Facility Selection Dialog - shown when creating new client without facility parameter */}
      <Dialog open={facilitySelectionOpen} onClose={() => {
        setFacilitySelectionOpen(false);
        // Navigate back if user cancels
        history.push('/app/client/masterlist');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Select Facility</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please select which facility this client will be assigned to:
            </Typography>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Facility</InputLabel>
              <Select
                value={selectedFacilityId || ''}
                label="Facility"
                onChange={(e) => setSelectedFacilityId(e.target.value)}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.id}>
                    {facility.name}
                    {facility.address && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        - {facility.address}
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFacilitySelectionOpen(false);
            history.push('/app/client/masterlist');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleFacilitySelection} 
            variant="contained"
            disabled={!selectedFacilityId}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Success!"
        message={successMessage}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        itemName={client ? `${client.firstName} ${client.lastName}` : ''}
        message={`Are you sure you want to delete the client "${client ? `${client.firstName} ${client.lastName}` : ''}"?`}
        warningMessage="This action cannot be undone. All associated data will be permanently removed."
        loading={deleting}
      />
    </Box>
  );
}

export default ClientProfile;
