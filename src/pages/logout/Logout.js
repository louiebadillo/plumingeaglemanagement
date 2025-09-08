import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { useUserDispatch } from '../../context/UserContext';
import { signOut } from '../../context/UserContext';

function Logout(props) {
  const userDispatch = useUserDispatch();

  useEffect(() => {
    // Call the signOut function which handles clearing tokens and redirecting
    signOut(userDispatch, props.history);
  }, [userDispatch, props.history]);

  // This component doesn't render anything as it immediately redirects
  return null;
}

export default withRouter(Logout);
