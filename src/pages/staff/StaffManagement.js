import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';

// Staff data is now loaded from Supabase

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee',
    phone: '',
    username: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [staffToResetPassword, setStaffToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // Debug: Log loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed to:', loading);
  }, [loading]);
  const [renderKey, setRenderKey] = useState(0);

  // Debug: Log when staff state changes
  useEffect(() => {
    console.log('🔄 Staff state changed:', staff.length, 'users');
    console.log('🔄 Full staff array:', staff);
    if (staff.length > 0) {
      console.log('👥 First user:', staff[0]);
      console.log('👥 All user IDs:', staff.map(s => s.id));
    } else {
      console.log('⚠️ Staff array is empty!');
    }
  }, [staff]);

  // Load users from Supabase on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading users from Supabase...');
        
        // ✅ FIX #1: Replaced fetch() with Supabase admin client (parameterized, secure)
        console.log('🔍 Fetching users from Supabase...');
        
        const { data: users, error } = await supabaseAdmin
          .from('users')
          .select('*');
        
        if (error) {
          console.error('❌ Error fetching users:', error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }
        
        console.log('✅ Query completed, checking results...');
        console.log('📋 Raw users data from Supabase:', users);
        console.log('📊 Raw users count:', users ? users.length : 0);

        if (!users || users.length === 0) {
          console.log('⚠️ No users found in Supabase');
          setStaff([]);
          return;
        }

        console.log('🔄 Starting user transformation...');

               // Transform Supabase users to match the expected format
               const transformedUsers = users.map(user => ({
                 id: user.id,
                 firstName: user.first_name || '',
                 lastName: user.last_name || '',
                 email: user.email,
                 role: user.role,
                 phone: user.phone || '',
                 password: '***' // Don't show actual passwords
               }));

        console.log('✅ Loaded users from Supabase:', transformedUsers);
        console.log('📊 Number of users loaded:', transformedUsers.length);
        console.log('🔄 Setting staff state...');
        setStaff(transformedUsers);
        setError(null); // Clear any previous errors
        console.log('✅ Staff state set successfully');
      } catch (error) {
        console.error('💥 Error in loadUsers:', error);
        setError(`Failed to load staff members: ${error.message}`);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    loadUsers();

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array to run only once on mount

  const filteredStaff = staff.filter(member => {
    if (!member || !member.id) return false; // Skip invalid members
    
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                         fullName.includes(searchTerm.toLowerCase()) ||
                         (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'employee',
      phone: ''
    });
    setOpenDialog(true);
  };

  const handleEditStaff = (staffMember) => {
    console.log('🔍 handleEditStaff called with:', staffMember);
    console.log('🔍 Staff member ID:', staffMember.id);
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      password: '', // Don't show existing password
      role: staffMember.role,
      phone: staffMember.phone
    });
    setOpenDialog(true);
  };

  const handleDeleteStaff = (staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (staffMember) => {
    setStaffToResetPassword(staffMember);
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!staffToResetPassword) {
      alert('No staff member selected');
      return;
    }

    try {
      setResettingPassword(true);
      console.log('🔄 Resetting password for user:', staffToResetPassword.id);
      
      // Update user password using Admin API
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        staffToResetPassword.id,
        { password: newPassword }
      );

      if (error) {
        console.error('❌ Password reset failed:', error);
        alert('Error resetting password: ' + error.message);
        return;
      }

      console.log('✅ Password reset successfully');
      setSuccessMessage(`Password reset successfully for ${staffToResetPassword.firstName} ${staffToResetPassword.lastName}`);
      setSuccessModalOpen(true);
      setResetPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setStaffToResetPassword(null);
    } catch (error) {
      console.error('💥 Password reset error:', error);
      alert('An error occurred while resetting the password: ' + error.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setDeleting(true);
      console.log('🗑️ Deleting staff member:', staffToDelete.id);
      
      // Using Supabase Admin (already imported at top)
      console.log('📦 Using SupabaseAdmin for deletion');
      
      // Delete from auth.users (this will cascade to public.users due to foreign key)
      console.log('👤 Deleting user from auth.users:', staffToDelete.id);
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(staffToDelete.id);
      
      if (authError) {
        console.error('❌ Auth user deletion failed:', authError);
        alert('Error deleting user: ' + authError.message);
        setDeleting(false);
        return;
      }
      
      console.log('✅ User deleted from auth.users successfully');
      
      // Also explicitly delete from public.users table (in case cascade didn't work)
      console.log('🗑️ Deleting user profile from public.users:', staffToDelete.id);
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', staffToDelete.id);
      
      if (profileError) {
        console.warn('⚠️ Profile deletion failed (may have been cascaded):', profileError);
        // Don't show error to user as the main deletion succeeded
      } else {
        console.log('✅ User profile deleted from public.users successfully');
      }
      
      // Update local state immediately
      const updatedStaff = staff.filter(member => member.id !== staffToDelete.id);
      setStaff(updatedStaff);
      setRenderKey(prev => prev + 1); // Force table re-render
      
      console.log('🎉 Staff member deleted successfully!');
      
      // Close delete dialog and show success
      setDeleteDialogOpen(false);
      const deletedName = `${staffToDelete.firstName} ${staffToDelete.lastName}`;
      setStaffToDelete(null);
      setSuccessMessage(`Staff member "${deletedName}" has been deleted successfully.`);
      setSuccessModalOpen(true);
      
      // ✅ FIX #1: Replaced fetch() with Supabase admin client (parameterized, secure)
      // Reload users from Supabase to confirm deletion
      console.log('🔄 Reloading users after deletion...');
      const { data: remainingUsers, error: reloadError } = await supabaseAdmin
        .from('users')
        .select('*');
      
      if (!reloadError && remainingUsers) {
        const transformedUsers = remainingUsers.map(user => ({
          id: user.id,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          password: '***'
        }));
        setStaff(transformedUsers);
        setRenderKey(prev => prev + 1);
        console.log('✅ Users reloaded after deletion, count:', transformedUsers.length);
      } else {
        console.error('❌ Reload failed:', reloadError);
      }
      
    } catch (error) {
      console.error('💥 Delete operation failed with error:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Error deleting staff member: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveStaff = async () => {
    // Prevent double submissions
    if (submitting) {
      console.log('⚠️ Already submitting, ignoring duplicate request');
      return;
    }
    
    // Validate required fields for new staff
    if (!editingStaff) {
      if (!formData.firstName.trim()) {
        alert('Please enter a first name');
        return;
      }
      if (!formData.lastName.trim()) {
        alert('Please enter a last name');
        return;
      }
      if (!formData.email.trim()) {
        alert('Please enter an email address');
        return;
      }
      if (!formData.password || !formData.password.trim()) {
        alert('Please enter a password for the new staff member');
        return;
      }
      // Validate password length (Supabase requires at least 6 characters)
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      console.log('🚀 Starting staff save operation...');
      
      // Get Supabase config once for the entire function
      const { supabaseUrl } = getSupabaseConfig();
      const headers = getSupabaseHeaders();
      
      if (editingStaff) {
        // Update existing staff in Supabase
        console.log('🔄 Updating staff member in Supabase:', editingStaff.id);
        console.log('📝 Form data to update:', {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        });
        
        // Update user profile in Supabase using direct fetch with service role
        console.log('🔄 Updating user profile in public.users table...');
        console.log('📦 Using direct fetch with service role key...');
        const updateUrl = `${supabaseUrl}/rest/v1/users?id=eq.${editingStaff.id}`;
        console.log('🌐 Update URL:', updateUrl);
        
        const requestBody = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        };
        
        console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            ...getSupabaseHeaders(),
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Update failed:', response.status, errorText);
          throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
        }

        const updateData = await response.json();
        console.log('📥 Response data:', updateData);
        console.log('✅ Staff member updated in Supabase successfully!', updateData);
        
        // Update local state immediately
        console.log('🔍 Current staff state:', staff);
        console.log('🔍 Editing staff ID:', editingStaff.id);
        console.log('🔍 Form data:', formData);
        
        const updatedStaff = staff.map(member => {
          console.log('🔍 Checking member:', member.id, 'vs', editingStaff.id);
          return member.id === editingStaff.id 
            ? { 
                ...member, 
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                password: formData.password || member.password // Keep existing password if not changed
              }
            : member;
        });
        console.log('🔄 Updating local state with:', updatedStaff);
        setStaff([...updatedStaff]); // Force re-render with new array reference
        setRenderKey(prev => prev + 1); // Force table re-render
        console.log('⏰ Local state updated at:', new Date().toISOString());
        // Close dialog and show success modal
        setOpenDialog(false);
        setSubmitting(false);
        setEditingStaff(null);
        setFormData(initialFormData);
        setSuccessMessage(`Staff member "${formData.firstName} ${formData.lastName}" has been updated successfully.`);
        setSuccessModalOpen(true);
 
        // Reload users from Supabase to get the latest data
        console.log('🔄 Reloading users after update...');
        console.log('⏰ Waiting 2 seconds for database to process update...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ✅ FIX #1: Replaced fetch() with Supabase admin client (parameterized, secure)
        const { data: reloadedUsers, error: reloadError } = await supabaseAdmin
          .from('users')
          .select('*');
        
        if (!reloadError && reloadedUsers) {
          const updatedUsers = await reloadResponse.json();
          console.log('📋 Raw updated users from reload:', updatedUsers);
          const transformedUsers = updatedUsers.map(user => ({
            id: user.id,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            password: '***'
          }));
          console.log('🔄 Transformed users for state:', transformedUsers);
          setStaff([...transformedUsers]); // Force re-render with new array reference
          setRenderKey(prev => prev + 1); // Force table re-render
          console.log('⏰ Reload state updated at:', new Date().toISOString());
          console.log('✅ Users reloaded after update');
        } else {
          console.error('❌ Reload failed:', reloadError);
        }
      } else {
        // Add new staff using Supabase
        console.log('🚀 Creating staff member with data:', formData);
        console.log('📦 Using SupabaseAdmin (already imported)');
        
        // Try to create user with Supabase Admin API
        console.log('👤 Creating auth user with email:', formData.email);
        
        // Ensure password is provided and valid (validation should have caught this, but double-check)
        const password = formData.password?.trim();
        if (!password || password.length < 6) {
          alert('Password is required and must be at least 6 characters long');
          setSubmitting(false);
          return;
        }
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email.trim(),
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: formData.firstName || '',
            last_name: formData.lastName || '',
            role: formData.role || 'employee',
            phone: formData.phone || ''
          }
        });

        let userId;
        if (authError) {
          if (authError.message.includes('already been registered')) {
            console.log('⚠️ User already exists in auth, attempting to create profile only');
            // User exists in auth but not in public.users, try to find their ID
            try {
              const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
              if (listError) {
                console.error('❌ Failed to list users:', listError);
                alert('A user with this email already exists. Please use a different email address.');
                return;
              }
              
              const existingUser = existingUsers.users.find(u => u.email === formData.email);
              if (existingUser) {
                console.log('✅ Found existing user in auth:', existingUser.id);
                userId = existingUser.id;
              } else {
                console.error('❌ User not found in auth list');
                alert('A user with this email already exists. Please use a different email address.');
                return;
              }
            } catch (error) {
              console.error('❌ Error finding existing user:', error);
              alert('A user with this email already exists. Please use a different email address.');
              return;
            }
          } else {
            console.error('❌ Auth user creation failed:', authError);
            alert('Error creating staff member: ' + authError.message);
            return;
          }
        } else {
          console.log('✅ Auth user created successfully:', authData.user.id);
          userId = authData.user.id;
        }

        // Create the user profile manually (in case trigger failed)
        console.log('🔄 Creating user profile in public.users table...');
        const profileUrl = `${supabaseUrl}/rest/v1/users`;
        const profileBody = {
          id: userId,
          email: formData.email || '',
          first_name: formData.firstName || '',
          last_name: formData.lastName || '',
          phone: formData.phone || '',
          role: formData.role || 'employee'
        };
        console.log('📤 Profile upsert body:', JSON.stringify(profileBody, null, 2));
        const profileResp = await fetch(profileUrl, {
          method: 'POST',
          headers: {
            ...getSupabaseHeaders(),
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(profileBody)
        });
        console.log('📡 Profile upsert status:', profileResp.status, 'ok:', profileResp.ok);
        if (!profileResp.ok) {
          const errText = await profileResp.text();
          console.error('❌ Profile creation failed:', profileResp.status, errText);
          alert('User created but profile failed: ' + errText);
          return;
        }
        const profileData = await profileResp.json();
        console.log('✅ User profile created successfully:', profileData);

        console.log('🎉 Staff member created successfully!');
        // Close dialog and show success modal
        setOpenDialog(false);
        setSubmitting(false);
        setFormData(initialFormData);
        setSuccessMessage(`Staff member "${formData.firstName} ${formData.lastName}" has been created successfully.`);
        setSuccessModalOpen(true);
        
        // Wait a moment for the database to process the changes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ✅ FIX #1: Replaced fetch() with Supabase admin client (parameterized, secure)
        // Reload users from Supabase to get the latest data
        console.log('🔄 Reloading users after creation...');
        const { data: reloadedUsers, error: reloadError } = await supabaseAdmin
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!reloadError && reloadedUsers) {
          const updatedUsers = await reloadResponse.json();
          console.log('📋 Raw updated users from reload:', updatedUsers);
          const transformedUsers = updatedUsers.map(user => ({
            id: user.id,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            password: '***'
          }));
          console.log('🔄 Transformed users for state:', transformedUsers);
          setStaff([...transformedUsers]); // Force re-render with new array reference
          setRenderKey(prev => prev + 1); // Force table re-render
          console.log('✅ Users reloaded after creation');
        } else {
          console.error('❌ Reload failed:', reloadError);
        }
      }
      
    } catch (error) {
      console.error('💥 Staff operation failed with error:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Error: ' + error.message);
      setSubmitting(false);
    } finally {
      // Always close form and reset data, regardless of success or failure
      // Note: setSubmitting(false) is handled in success paths to avoid race conditions
      setOpenDialog(false);
      setFormData(initialFormData);
      setEditingStaff(null);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'employee': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      default: return 'default';
    }
  };

  const generateUsername = (firstName, lastName) => {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Staff Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage staff members, roles, and access credentials
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStaff}
          color="primary"
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            id="search-staff"
            name="search-staff"
            fullWidth
            variant="outlined"
            placeholder="Search by name, email, or username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Staff Table */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Staff Members ({filteredStaff.length})
            </Typography>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🔄 Manual refresh triggered');
                setLoading(true);
                try {
                  // ✅ FIX #1: Replaced fetch() with Supabase admin client (parameterized, secure)
                  const { data: users, error: fetchError } = await supabaseAdmin
                    .from('users')
                    .select('*');
                  
                  if (!fetchError && users) {
                    const users = await response.json();
                    const transformedUsers = users.map(user => ({
                      id: user.id,
                      firstName: user.first_name || '',
                      lastName: user.last_name || '',
                      email: user.email,
                      role: user.role,
                      phone: user.phone || '',
                      password: '***'
                    }));
                    setStaff([...transformedUsers]);
                    setRenderKey(prev => prev + 1);
                    console.log('✅ Manual refresh completed:', transformedUsers.length, 'users');
                  } else {
                    console.error('❌ Manual refresh failed:', fetchError);
                  }
                } catch (error) {
                  console.error('💥 Manual refresh error:', error);
                } finally {
                  setLoading(false);
                }
              }}
              size="small"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table key={renderKey}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Loading staff members from Supabase...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.filter(member => member && member.id).map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {(member.firstName || 'U')[0]}{(member.lastName || 'U')[0]}
                          </Avatar>
                          <Typography variant="subtitle2">
                            {member.firstName || 'Unknown'} {member.lastName || 'User'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {member.email || 'No email'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {member.phone || 'Not provided'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={(member.role || 'employee').charAt(0).toUpperCase() + (member.role || 'employee').slice(1)} 
                          color={getRoleColor(member.role || 'employee')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit Staff">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditStaff(member)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton 
                              size="small" 
                              onClick={() => handleResetPassword(member)}
                              color="warning"
                            >
                              <LockResetIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Staff">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteStaff(member)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No staff members found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="firstName"
                name="firstName"
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => {
                  const firstName = e.target.value;
                  setFormData({
                    ...formData,
                    firstName,
                    username: editingStaff ? formData.username : generateUsername(firstName, formData.lastName)
                  });
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="lastName"
                name="lastName"
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => {
                  const lastName = e.target.value;
                  setFormData({
                    ...formData,
                    lastName,
                    username: editingStaff ? formData.username : generateUsername(formData.firstName, lastName)
                  });
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="email"
                name="email"
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="phone"
                name="phone"
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="password"
                name="password"
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <HideIcon /> : <ViewIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={editingStaff ? "Leave blank to keep current password" : "Required for new staff"}
                required={!editingStaff}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!editingStaff && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Login Credentials:</strong> Email: {formData.email} | 
                    Password: {formData.password || 'Will be generated'}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          {!editingStaff && (
            <Button 
              onClick={() => setFormData({ ...formData, password: generatePassword() })}
              color="secondary"
            >
              Generate Password
            </Button>
          )}
          <Button 
            onClick={async () => {
              console.log('🔘 Update/Create button clicked!');
              console.log('🔍 Current loading state:', loading);
              console.log('🔍 Current submitting state:', submitting);
              console.log('🔍 Current editingStaff:', editingStaff);
              console.log('🔍 Current formData:', formData);
              await handleSaveStaff();
            }} 
            variant="contained"
            disabled={loading || submitting}
          >
            {submitting ? 'Saving...' : (editingStaff ? 'Update' : 'Create')} Staff Member
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
          onClose={() => {
            setDeleteDialogOpen(false);
            setStaffToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Staff Member"
          itemName={staffToDelete ? `${staffToDelete.firstName} ${staffToDelete.lastName}` : ''}
          message={`Are you sure you want to delete the staff member "${staffToDelete ? `${staffToDelete.firstName} ${staffToDelete.lastName}` : ''}"?`}
          warningMessage="This action cannot be undone. The staff member will be permanently removed from the system."
          loading={deleting}
        />

        {/* Reset Password Dialog */}
        <Dialog 
          open={resetPasswordDialogOpen} 
          onClose={() => {
            if (!resettingPassword) {
              setResetPasswordDialogOpen(false);
              setNewPassword('');
              setConfirmPassword('');
              setStaffToResetPassword(null);
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Reset Password for {staffToResetPassword?.firstName} {staffToResetPassword?.lastName}
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter a new password for this user. The password must be at least 6 characters long.
            </Alert>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={resettingPassword}
                  helperText="Must be at least 6 characters"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <HideIcon /> : <ViewIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={resettingPassword}
                  error={confirmPassword && newPassword !== confirmPassword}
                  helperText={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <HideIcon /> : <ViewIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword('');
                setConfirmPassword('');
                setStaffToResetPassword(null);
              }} 
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmResetPassword} 
              variant="contained" 
              color="primary"
              disabled={resettingPassword || !newPassword || !confirmPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              startIcon={resettingPassword ? <CircularProgress size={20} /> : <LockResetIcon />}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
  
  export default StaffManagement;
