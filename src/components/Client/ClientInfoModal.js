import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Box,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  PersonOutline as PersonOutlineIcon,
  CalendarToday as CalendarIcon,
  Room as RoomIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { calculateAge } from '../../utils/dateHelpers';
import { formatDate } from '../../context/clientMock';

function ClientInfoModal({ open, onClose, clientId }) {
  const [client, setClient] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      loadClientData();
    } else {
      setClient(null);
      setFacility(null);
    }
  }, [open, clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
      // Load client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (clientError) {
        throw new Error(`Failed to fetch client: ${clientError.message}`);
      }

      if (clientData) {
        const supabaseClient = clientData;
        
        // Load facility
        if (supabaseClient.facility_id) {
          const { data: facilityData, error: facilityError } = await supabase
            .from('facilities')
            .select('*')
            .eq('id', supabaseClient.facility_id)
            .maybeSingle();

          if (!facilityError && facilityData) {
            if (facilityData && facilityData.length > 0) {
              setFacility(facilityData[0]);
            }
          }
        }

        // Transform to match expected structure
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
          allergies: supabaseClient.allergies,
          diagnosis: supabaseClient.diagnosis,
          familyDoctor: supabaseClient.family_doctor,
          dentist: supabaseClient.dentist,
          optometrist: supabaseClient.optometrist,
          specialist: supabaseClient.specialist,
          pediatrician: supabaseClient.pediatrician,
          allowedContacts: supabaseClient.allowed_contacts || [],
          risksAndPreferences: supabaseClient.risks_and_preferences
        };

        setClient(transformedClient);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {client ? `${client.firstName} ${client.lastName}` : 'Client Information'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : client ? (
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
                        secondary={`${client.age} years old`} 
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
                        primary="Room" 
                        secondary={client.room || 'Not assigned'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><HomeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Facility" 
                        secondary={facility?.name || 'Not assigned'} 
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
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Allowed Contacts */}
            {client.allowedContacts && client.allowedContacts.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Allowed Contacts
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense>
                      {client.allowedContacts.map((contact, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={contact.name || 'Unnamed Contact'}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" display="block">{contact.phone || 'No phone'}</Typography>
                                {contact.relationship && (
                                  <Typography component="span" variant="caption" color="textSecondary" display="block">
                                    {contact.relationship}
                                  </Typography>
                                )}
                              </>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                      ))}
                    </List>
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
                      Risks and Preferences
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {client.risksAndPreferences}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography>Client not found</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ClientInfoModal;

