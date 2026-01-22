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
import { supabase } from '../../lib/supabase';
import SocialMediaManager from '../../components/Client/SocialMediaManager';
import AllowedContactsManager from '../../components/Client/AllowedContactsManager';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';
import { uploadProfilePhoto, deleteProfilePhoto, getProfilePhotoUrl } from '../../utils/fileUpload';
import ImageCropDialog from '../../components/ImageCrop/ImageCropDialog';
import { blobToFile } from '../../utils/imageUtils';

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoPath, setProfilePhotoPath] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  
  const { userProfile } = useSupabase();
  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';
  // Check if this is a new client - check the URL path first (most reliable)
  // When using exact route, clientSlug might be undefined, so check pathname
  const isNewClient = !clientSlug || clientSlug === 'new' || window.location.pathname === '/app/client/new' || window.location.pathname.endsWith('/client/new');

  // Helper function to load facility information
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const loadFacilityInfo = async (facilityId) => {
    try {
      const { data: facilityData, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading facility:', error);
        return;
      }
      
      if (facilityData) {
        setFacility(facilityData);
      }
      } catch (error) {
      console.error('Error loading facility:', error);
    }
  };

  // Helper function to load all facilities for selection
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const loadFacilities = async () => {
    try {
      const { data: facilitiesData, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error loading facilities:', error);
        return [];
      }
      
      setFacilities(facilitiesData || []);
      return facilitiesData || [];
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
        familyDoctorCheckup: '',
        dentist: '',
        dentistCheckup: '',
        optometrist: '',
        optometristCheckup: '',
        specialist: '',
        specialistCheckup: '',
        pediatrician: '',
        pediatricianCheckup: '',
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
        status: 'active',
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
          let supabaseClient = null;
          
          // Check if clientSlug is a UUID (client ID)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isClientId = uuidRegex.test(clientSlug);
          
          if (isClientId) {
            // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
            // Load client directly by ID
            const { data, error } = await supabase
              .from('clients')
              .select('*')
              .eq('id', clientSlug)
              .maybeSingle();
            
            if (error) {
              throw new Error(`Failed to fetch client: ${error.message}`);
            }
            
            if (data) {
              supabaseClient = data; // maybeSingle() returns a single object, not an array
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
            
            // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
            // Query by first and last name
            const { data, error } = await supabase
              .from('clients')
              .select('*')
              .eq('first_name', firstName)
              .eq('last_name', lastName)
              .maybeSingle();
            
            if (error) {
              throw new Error(`Failed to fetch client: ${error.message}`);
            }
            
            if (data) {
              foundClient = data;
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
              familyDoctorCheckup: supabaseClient.family_doctor_checkup,
              dentist: supabaseClient.dentist,
              dentistCheckup: supabaseClient.dentist_checkup,
              optometrist: supabaseClient.optometrist,
              optometristCheckup: supabaseClient.optometrist_checkup,
              specialist: supabaseClient.specialist,
              specialistCheckup: supabaseClient.specialist_checkup,
              pediatrician: supabaseClient.pediatrician,
              pediatricianCheckup: supabaseClient.pediatrician_checkup,
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
              status: supabaseClient.status || 'active',
              profilePhoto: supabaseClient.profile_photo_url,
              assignedStaff: [],
              lastUpdated: supabaseClient.updated_at
            };
            
            setClient(transformedClient);
            setEditingClient(transformedClient);
            
            // Load signed URL for profile photo if it exists
            if (supabaseClient.profile_photo_url) {
              try {
                const signedUrl = await getProfilePhotoUrl(supabaseClient.profile_photo_url, 3600);
                setProfilePhotoUrl(signedUrl);
              } catch (error) {
                console.error('Error loading profile photo URL:', error);
              }
            }
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
          status: editingClient.status || 'active',
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
          family_doctor_checkup: cleanDateField(editingClient.familyDoctorCheckup),
          dentist: editingClient.dentist,
          dentist_checkup: cleanDateField(editingClient.dentistCheckup),
          optometrist: editingClient.optometrist,
          optometrist_checkup: cleanDateField(editingClient.optometristCheckup),
          specialist: editingClient.specialist,
          specialist_checkup: cleanDateField(editingClient.specialistCheckup),
          pediatrician: editingClient.pediatrician,
          pediatrician_checkup: cleanDateField(editingClient.pediatricianCheckup),
          allowed_contacts: editingClient.allowedContacts || [],
          risks_and_preferences: editingClient.risksAndPreferences,
          profile_photo_url: editingClient.profilePhoto || null,
          facility_id: facilityFromUrl || editingClient.facility // Use the facility ID from URL or from editingClient
        };
        
        console.log('🆕 Creating new client with data:', clientData);
        
        // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Supabase error response:', error);
          throw new Error(`Failed to create client: ${error.message}`);
        }
        
        console.log('✅ Client created successfully:', newClient);
        
        // If there's a profile photo to upload (stored temporarily), upload it now
        if (editingClient.profilePhoto && editingClient.profilePhoto.startsWith('blob:')) {
          // This means we have a temporary file URL, we need to handle it differently
          // For now, we'll skip this and let the user upload after creation
        }
        
        setEditDialogOpen(false);
        // Show success modal before redirecting
        setSuccessMessage(`Client "${editingClient.firstName} ${editingClient.lastName}" has been created successfully.`);
        setSuccessModalOpen(true);
        // Redirect to the new client's profile page after a short delay
        setTimeout(() => {
          const clientUrl = createClientUrl(newClient);
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
          status: editingClient.status || 'active',
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
          profile_photo_url: editingClient.profilePhoto || null
        };
        
        console.log('🔄 Updating client with data:', clientData);
        
        // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
        const { data: updatedClient, error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Supabase error response:', error);
          throw new Error(`Failed to update client: ${error.message}`);
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
      
      // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) {
        throw new Error(`Failed to delete client: ${error.message}`);
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

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview URL for cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target.result);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      setUploadingPhoto(true);
      
      // Convert blob to File
      const croppedFile = blobToFile(croppedBlob, 'profile-photo.jpg');
      
      // For new clients, we need to create the client first
      // For existing clients, upload immediately
      if (client?.id || editingClient?.id) {
        const clientId = client?.id || editingClient?.id;
        const result = await uploadProfilePhoto(croppedFile, clientId);
        
        // Store the path (not URL, since it's private)
        setProfilePhotoPath(result.path);
        
        // Generate signed URL for preview
        const signedUrl = await getProfilePhotoUrl(result.path, 3600);
        
        // Update editing client with the path (we'll use signed URLs when displaying)
        setEditingClient(prev => ({
          ...prev,
          profilePhoto: result.path // Store path, not URL
        }));
        
        // Also update the current client state for immediate preview
        if (client) {
          setClient(prev => ({
            ...prev,
            profilePhoto: result.path
          }));
        }
        
        setProfilePhotoUrl(signedUrl);
      } else {
        // For new clients, store the file temporarily
        // We'll upload after client creation
        const tempUrl = URL.createObjectURL(croppedBlob);
        setEditingClient(prev => ({
          ...prev,
          profilePhoto: tempUrl // Temporary blob URL
        }));
        // Store the blob for later upload
        setImageToCrop(croppedBlob);
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert(`Error uploading profile photo: ${error.message}`);
    } finally {
      setUploadingPhoto(false);
      setCropDialogOpen(false);
      setImageToCrop(null);
    }
  };

  const handleProfilePhotoRemove = async () => {
    if (!profilePhotoPath && !editingClient?.profilePhoto) {
      // Just remove from UI if no path stored
      setEditingClient(prev => ({
        ...prev,
        profilePhoto: null
      }));
      if (client) {
        setClient(prev => ({
          ...prev,
          profilePhoto: null
        }));
      }
      return;
    }

    try {
      // Extract path from URL if we have a URL but not a path
      let pathToDelete = profilePhotoPath;
      if (!pathToDelete && editingClient?.profilePhoto) {
        // Extract path from URL (format: https://...supabase.co/storage/v1/object/public/profile-photos/client-{id}/...)
        const urlParts = editingClient.profilePhoto.split('/profile-photos/');
        if (urlParts.length > 1) {
          pathToDelete = urlParts[1];
        }
      }

      if (pathToDelete) {
        await deleteProfilePhoto(pathToDelete);
      }

      // Update state
      setEditingClient(prev => ({
        ...prev,
        profilePhoto: null
      }));
      if (client) {
        setClient(prev => ({
          ...prev,
          profilePhoto: null
        }));
      }
      setProfilePhotoPath(null);
    } catch (error) {
      console.error('Error removing profile photo:', error);
      alert(`Error removing profile photo: ${error.message}`);
    }
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
      <Paper sx={{ p: 3, mb: 3, display: 'flex', overflow: 'hidden' }}>
        <Box
          sx={{
            width: 150,
            minWidth: 150,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            mr: 3
          }}
        >
          {profilePhotoUrl || (client?.profilePhoto && !client.profilePhoto.startsWith('client-') ? client.profilePhoto : null) ? (
            <Box
              component="img"
              src={profilePhotoUrl || (client?.profilePhoto && !client.profilePhoto.startsWith('client-') ? client.profilePhoto : null)}
              alt={`${client?.firstName} ${client?.lastName}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          ) : (
            <Typography 
              variant="h2" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              {client?.firstName?.[0]}{client?.lastName?.[0]}
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {client?.firstName} {client?.lastName}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="textSecondary">
                Room {client?.room || 'Not assigned'} • {facility?.name || 'Facility not found'}
              </Typography>
              <Chip
                label={client?.status === 'active' ? 'Active' : client?.status === 'discharged' ? 'Discharged' : 'Active'}
                color={client?.status === 'active' ? 'success' : client?.status === 'discharged' ? 'warning' : 'success'}
                size="small"
              />
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
      </Paper>

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
                      secondary={
                        <Box>
                          <Typography variant="body2">{client.familyDoctor}</Typography>
                          {client.familyDoctorCheckup && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Recent Annual Checkup: {formatDate(client.familyDoctorCheckup)}
                            </Typography>
                          )}
                        </Box>
                      } 
                    />
                  </ListItem>
                )}
                {client.dentist && (
                  <ListItem>
                    <ListItemText 
                      primary="Dentist" 
                      secondary={
                        <Box>
                          <Typography variant="body2">{client.dentist}</Typography>
                          {client.dentistCheckup && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Recent Annual Checkup: {formatDate(client.dentistCheckup)}
                            </Typography>
                          )}
                        </Box>
                      } 
                    />
                  </ListItem>
                )}
                {client.optometrist && (
                  <ListItem>
                    <ListItemText 
                      primary="Optometrist" 
                      secondary={
                        <Box>
                          <Typography variant="body2">{client.optometrist}</Typography>
                          {client.optometristCheckup && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Recent Annual Checkup: {formatDate(client.optometristCheckup)}
                            </Typography>
                          )}
                        </Box>
                      } 
                    />
                  </ListItem>
                )}
                {client.specialist && (
                  <ListItem>
                    <ListItemText 
                      primary="Specialist" 
                      secondary={
                        <Box>
                          <Typography variant="body2">{client.specialist}</Typography>
                          {client.specialistCheckup && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Recent Annual Checkup: {formatDate(client.specialistCheckup)}
                            </Typography>
                          )}
                        </Box>
                      } 
                    />
                  </ListItem>
                )}
                {client.pediatrician && (
                  <ListItem>
                    <ListItemText 
                      primary="Pediatrician" 
                      secondary={
                        <Box>
                          <Typography variant="body2">{client.pediatrician}</Typography>
                          {client.pediatricianCheckup && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Recent Annual Checkup: {formatDate(client.pediatricianCheckup)}
                            </Typography>
                          )}
                        </Box>
                      } 
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
            {/* Profile Photo Upload */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
                  src={profilePhotoUrl || (editingClient?.profilePhoto && !editingClient.profilePhoto.startsWith('client-') ? editingClient.profilePhoto : null)}
                >
                  {editingClient?.firstName?.[0]}{editingClient?.lastName?.[0]}
                </Avatar>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-photo-upload"
                    type="file"
                    onChange={handleProfilePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <label htmlFor="profile-photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCameraIcon />}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Uploading...' : editingClient?.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </label>
                  {editingClient?.profilePhoto && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleProfilePhotoRemove}
                      disabled={uploadingPhoto}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  JPG, PNG, or WEBP (max 5MB, will be compressed to 800x800px)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingClient.status || 'active'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="discharged">Discharged</MenuItem>
                </Select>
              </FormControl>
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
                label="Family Doctor - Recent Annual Checkup"
                type="date"
                value={editingClient.familyDoctorCheckup || ''}
                onChange={(e) => handleInputChange('familyDoctorCheckup', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
                label="Dentist - Recent Annual Checkup"
                type="date"
                value={editingClient.dentistCheckup || ''}
                onChange={(e) => handleInputChange('dentistCheckup', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
                label="Optometrist - Recent Annual Checkup"
                type="date"
                value={editingClient.optometristCheckup || ''}
                onChange={(e) => handleInputChange('optometristCheckup', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
                label="Specialist - Recent Annual Checkup"
                type="date"
                value={editingClient.specialistCheckup || ''}
                onChange={(e) => handleInputChange('specialistCheckup', e.target.value)}
                InputLabelProps={{ shrink: true }}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pediatrician - Recent Annual Checkup"
                type="date"
                value={editingClient.pediatricianCheckup || ''}
                onChange={(e) => handleInputChange('pediatricianCheckup', e.target.value)}
                InputLabelProps={{ shrink: true }}
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

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onClose={() => {
          setCropDialogOpen(false);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspect={1}
      />

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
