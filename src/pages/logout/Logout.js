import { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

function Logout(props) {
  const { signOut } = useSupabase();

  useEffect(() => {
    // Call the Supabase signOut function immediately
    console.log('🔄 Logout component: Starting logout...');
    signOut();
  }, [signOut]);

  // Show loading message while logging out
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontSize: '18px',
      color: '#666'
    }}>
      <div>Logging out...</div>
      <div style={{ fontSize: '14px', marginTop: '10px' }}>
        Please wait while we sign you out...
      </div>
    </div>
  );
}

export default withRouter(Logout);
