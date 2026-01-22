import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Paper,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ClientFileManager from '../../components/Client/ClientFileManager';
import { getProfilePhotoUrl } from '../../utils/fileUpload';

function ClientFiles() {
  const { clientId } = useParams();
  const history = useHistory();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        
        console.log('Loading client with ID:', clientId);
        console.log('Client ID type:', typeof clientId);
        console.log('Client ID value:', clientId);

        // Fetch client data from Supabase using ID
        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select(`
            *,
            facilities (
              id,
              name,
              address
            )
          `)
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;
        
        if (clients) {
          // Transform data to match expected format
          const transformedClient = {
            id: clients.id,
            firstName: clients.first_name,
            lastName: clients.last_name,
            gender: clients.gender,
            room: clients.room,
            facility: clients.facility_id,
            facilities: clients.facilities,
            profilePhoto: clients.profile_photo_url
          };
          
          setClient(transformedClient);
          
          // Load signed URL for profile photo if it exists
          if (clients.profile_photo_url) {
            try {
              const signedUrl = await getProfilePhotoUrl(clients.profile_photo_url, 3600);
              setProfilePhotoUrl(signedUrl);
            } catch (error) {
              console.error('Error loading profile photo URL:', error);
            }
          }
        } else {
          setError('Client not found');
        }
      } catch (err) {
        console.error('Error loading client:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const handleBack = () => {
    history.push('/app/client-masterlist');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Client not found'}
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Client Masterlist
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/app/client-masterlist"
          onClick={(e) => {
            e.preventDefault();
            history.push('/app/client-masterlist');
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <HomeIcon fontSize="small" />
          Client Masterlist
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" />
          <Typography color="text.primary">
            {client.firstName} {client.lastName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon fontSize="small" />
          <Typography color="text.primary">Files</Typography>
        </Box>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, display: 'flex', overflow: 'hidden' }}>
        <Box
          sx={{
            width: 120,
            minWidth: 120,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            mr: 3
          }}
        >
          {profilePhotoUrl ? (
            <Box
              component="img"
              src={profilePhotoUrl}
              alt={`${client.firstName} ${client.lastName}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          ) : (
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              {client.firstName?.[0]}{client.lastName?.[0]}
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              File Management
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {client.firstName} {client.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Room: {client.room || 'N/A'} | Facility: {client.facilities?.name || 'N/A'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Masterlist
          </Button>
        </Box>
      </Paper>

      {/* File Manager */}
      <Card>
        <CardContent>
          <ClientFileManager 
            clientId={client.id}
            clientName={`${client.firstName} ${client.lastName}`}
            isAdmin={true}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default ClientFiles;
