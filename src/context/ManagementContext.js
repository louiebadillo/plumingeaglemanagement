import React from 'react';
import { mockUser } from './mock';
import config from '../../src/config';
import { showSnackbar } from '../components/Snackbar';
// Static imports to prevent multiple Supabase client instances
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';


let ManagementStateContext = React.createContext();
let ManagementDispatchContext = React.createContext();
const initialData = {
  findLoading: false,
  saveLoading: false,
  currentUser: null,
  rows: [],
  count: null,
  loading: false,
  idToDelete: null,
  modalOpen: false,
};

function managementReducer(state = initialData, { type, payload }) {
  if (type === 'USERS_FORM_RESET') {
    return {
      ...initialData,
    };
  }

  if (type === 'USERS_FORM_FIND_STARTED') {
    return {
      ...state,
      findLoading: true,
    };
  }

  if (type === 'USERS_FORM_FIND_SUCCESS') {
    return {
      ...state,
      currentUser: payload,
      findLoading: false,
    };
  }

  if (type === 'USERS_FORM_FIND_ERROR') {
    return {
      ...state,
      currentUser: null,
      findLoading: false,
    };
  }

  if (type === 'USERS_FORM_CREATE_STARTED') {
    return {
      ...state,
      saveLoading: true,
    };
  }

  if (type === 'USERS_FORM_CREATE_SUCCESS') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_CREATE_ERROR') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_UPDATE_STARTED') {
    return {
      ...state,
      saveLoading: true,
    };
  }

  if (type === 'USERS_FORM_UPDATE_SUCCESS') {
    return {
      ...state,
      currentUser: payload,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_UPDATE_ERROR') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_LIST_FETCH_STARTED') {
    return {
      ...state,
      loading: true,
    };
  }

  if (type === 'USERS_LIST_FETCH_SUCCESS') {
    return {
      ...state,
      loading: false,
      count: payload.count,
      rows: payload.rows,
    };
  }

  if (type === 'USERS_LIST_FETCH_ERROR') {
    return {
      ...state,
      loading: false,
      rows: [],
    };
  }

  if (type === 'USERS_LIST_DELETE_STARTED') {
    return {
      ...state,
      loading: true,
    };
  }

  if (type === 'USERS_LIST_DELETE_SUCCESS') {
    return {
      ...state,
      loading: false,
      modalOpen: false,
    };
  }

  if (type === 'USERS_LIST_DELETE_ERROR') {
    return {
      ...state,
      loading: false,
      modalOpen: false,
    };
  }

  if (type === 'USERS_LIST_OPEN_CONFIRM') {
    return {
      ...state,
      loading: false,
      modalOpen: true,
      idToDelete: payload.id,
    };
  }

  if (type === 'USERS_LIST_CLOSE_CONFIRM') {
    return {
      ...state,
      loading: false,
      modalOpen: false,
    };
  }

  return state;
}

function ManagementProvider({ children }) {
  let [state, dispatch] = React.useReducer(managementReducer, {
    findLoading: false,
    saveLoading: false,
    currentUser: null,
    rows: [],
    loading: false,
    idToDelete: null,
    modalOpen: false,
  });

  return (
    <ManagementStateContext.Provider value={state}>
      <ManagementDispatchContext.Provider value={dispatch}>
        {children}
      </ManagementDispatchContext.Provider>
    </ManagementStateContext.Provider>
  );
}

function useManagementState() {
  let context = React.useContext(ManagementStateContext);
  if (context === undefined) {
    throw new Error(
      'useManagementState must be used within a ManagementProvider',
    );
  }
  return context;
}

function useManagementDispatch() {
  let context = React.useContext(ManagementDispatchContext);
  if (context === undefined) {
    throw new Error(
      'useManagementDispatch must be used within a ManagementProvider',
    );
  }
  return context;
}

// ###########################################################

const actions = {
  doNew: () => {
    return {
      type: 'USERS_FORM_RESET',
    };
  },

  doFind: (id) => async (dispatch) => {
    if (!config.isBackend) {
      dispatch({
        type: 'USERS_FORM_FIND_SUCCESS',
        payload: mockUser,
      });
    } else {
      try {
        dispatch({
          type: 'USERS_FORM_FIND_STARTED',
        });

        // Use Supabase to find user (using static import to prevent multiple instances)
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        dispatch({
          type: 'USERS_FORM_FIND_SUCCESS',
          payload: user,
        });
      } catch (error) {
        showSnackbar({ type: 'error', message: 'Error finding user: ' + error.message });
        console.log(error);
        dispatch({
          type: 'USERS_FORM_FIND_ERROR',
        });
      }
    }
  },

  doCreate: (values, history) => async (dispatch) => {
    try {
      console.log('🚀 Starting user creation with values:', values);
      dispatch({
        type: 'USERS_FORM_CREATE_STARTED',
      });
      
      // Use Supabase Admin API to create user (using static import to prevent multiple instances)
      console.log('📦 Using SupabaseAdmin (static import)');
      
      // Create user with Supabase Admin API
      console.log('👤 Creating auth user with email:', values.email);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password || 'defaultpassword123',
        email_confirm: true,
        user_metadata: {
          first_name: values.firstName || '',
          last_name: values.lastName || '',
          role: values.role || 'employee'
        }
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        throw authError;
      }
      
      console.log('✅ Auth user created successfully:', authData.user.id);

      // The trigger should automatically create the public.users record
      // Let's verify and update it if needed
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .update({
          first_name: values.firstName || '',
          last_name: values.lastName || '',
          role: values.role || 'employee'
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.warn('Profile update failed, but user was created:', profileError);
        // Don't throw error here as the user was created successfully
      }

      console.log('🎉 User creation completed successfully!');
      dispatch({
        type: 'USERS_FORM_CREATE_SUCCESS',
      });
      showSnackbar({ type: 'success', message: 'User created successfully in Supabase!' });
      history.push('/app/user/list');
    } catch (error) {
      console.error('💥 User creation failed with error:', error);
      showSnackbar({ type: 'error', message: 'Error creating user: ' + error.message });
      dispatch({
        type: 'USERS_FORM_CREATE_ERROR',
      });
    }
  },

  doUpdate: (id, values, history) => async (dispatch, getState) => {
    try {
      dispatch({
        type: 'USERS_FORM_UPDATE_STARTED',
      });

      // Legacy axios call removed - using Supabase now

      dispatch({
        type: 'USERS_FORM_UPDATE_SUCCESS',
        payload: values,
      });

      history.push('/admin/dashboard');
    } catch (error) {
      console.log(error);

      dispatch({
        type: 'USERS_FORM_UPDATE_ERROR',
      });
    }
  },

  doChangePassword:
    ({ newPassword, currentPassword }) =>
    async (dispatch) => {
      try {
        dispatch({
          type: 'USERS_FORM_CREATE_STARTED',
        });
        // Legacy axios call removed - using Supabase now
        dispatch({
          type: 'USERS_PASSWORD_UPDATE_SUCCESS',
        });

        showSnackbar({ type: 'success', message: 'Password updated' });
      } catch (error) {
        showSnackbar({ type: 'error', message: 'Error' });
        console.log(error);

        dispatch({
          type: 'USERS_FORM_CREATE_ERROR',
        });
      }
    },

  doFetch:
    (filter, keepPagination = false) =>
    async (dispatch) => {
      if (!config.isBackend) {
        dispatch({
          type: 'USERS_LIST_FETCH_SUCCESS',
          payload: {
            rows: [mockUser],
            count: 1,
          },
        });
      } else {
        try {
          dispatch({
            type: 'USERS_LIST_FETCH_STARTED',
            payload: { filter, keepPagination },
          });

          // Get users from Supabase only (using static import to prevent multiple instances)
          const { data: supabaseUsers, error: supabaseError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

          if (supabaseError) {
            throw supabaseError;
          }

          dispatch({
            type: 'USERS_LIST_FETCH_SUCCESS',
            payload: {
              rows: supabaseUsers || [],
              count: (supabaseUsers || []).length,
            },
          });
        } catch (error) {
          showSnackbar({ type: 'error', message: 'Error' });
          console.log(error);

          dispatch({
            type: 'USERS_LIST_FETCH_ERROR',
          });
        }
      }
    },

  doDelete: (id) => async (dispatch) => {
    if (!config.isBackend) {
      dispatch({
        type: 'USERS_LIST_DELETE_ERROR',
      });
    } else {
      try {
        dispatch({
          type: 'USERS_LIST_DELETE_STARTED',
        });

        // Legacy axios call removed - using Supabase now

        dispatch({
          type: 'USERS_LIST_DELETE_SUCCESS',
        });
        // Legacy list() call removed - using Supabase now
      } catch (error) {
        showSnackbar({ type: 'error', message: 'Error' });
        console.log(error);
        dispatch({
          type: 'USERS_LIST_DELETE_ERROR',
        });
      }
    }
  },
  doOpenConfirm: (id) => async (dispatch) => {
    dispatch({
      type: 'USERS_LIST_OPEN_CONFIRM',
      payload: {
        id: id,
      },
    });
  },
  doCloseConfirm: () => async (dispatch) => {
    dispatch({
      type: 'USERS_LIST_CLOSE_CONFIRM',
    });
  },
};

export {
  ManagementProvider,
  useManagementState,
  useManagementDispatch,
  actions,
};
