import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Menu, MenuItem } from '@mui/material';
import {
  Person as AccountIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import classNames from 'classnames';

//images - using default avatar instead
import { getConfig } from '../../config/template';

// styles
import useStyles from './styles';

// components
import { Typography, Avatar } from '../Wrappers/Wrappers';

// context
import { useSupabase } from '../../context/SupabaseContext';

export default function Header(props) {
  let classes = useStyles();
  const history = useHistory();

  // global
  const { userProfile, signOut } = useSupabase();

  // local
  const [profileMenu, setProfileMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState();


  useEffect(() => {
    // User data is now handled by Supabase context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userProfile) {
      setCurrentUser({
        firstName: userProfile.first_name || 'Admin',
        lastName: userProfile.last_name || 'User',
        role: userProfile.role || 'employee',
        avatar: null
      });
    } else {
      // Default user data
      setCurrentUser({
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatar: null
      });
    }
  }, [userProfile]);

  const handleGoBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      // If no history, go to dashboard
      history.push('/app/dashboard');
    }
  };

  return (
    <AppBar position='fixed' className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <IconButton
          color='default'
          onClick={handleGoBack}
          className={classNames(
            classes.headerMenuButton,
            classes.headerMenuButtonCollapse,
          )}
          title="Go back"
        >
          <ArrowBackIcon
            classes={{
              root: classNames(
                classes.headerIcon,
                classes.headerIconCollapse,
              ),
            }}
          />
        </IconButton>
        <Typography variant='h6' weight='medium' className={classes.logotype}>
          {getConfig('COMPANY.NAME') || 'Pluming Eagle Lodge'}
        </Typography>
        <div className={classes.grow} />
        <IconButton
          aria-haspopup='true'
          color='default'
          className={classes.headerMenuButton}
          aria-controls='profile-menu'
          onClick={(e) => setProfileMenu(e.currentTarget)}
        >
          <Avatar
            alt={currentUser?.firstName}
            // eslint-disable-next-line no-mixed-operators
            src={
              (currentUser?.avatar?.length >= 1 &&
              currentUser?.avatar[currentUser.avatar.length - 1].publicUrl) || null
            }
            classes={{ root: classes.headerIcon }}
          >
            {currentUser?.firstName?.[0] || 'U'}
          </Avatar>
        </IconButton>
        <Typography
          block
          style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}
        >
          <Typography weight={'bold'} className={classes.profileLabel}>
            {currentUser?.firstName} {currentUser?.lastName}
          </Typography>
        </Typography>
        <Menu
          id='profile-menu'
          open={Boolean(profileMenu)}
          anchorEl={profileMenu}
          onClose={() => setProfileMenu(null)}
          className={classes.headerMenu}
          classes={{ paper: classes.profileMenu }}
          disableAutoFocusItem
        >
          <div className={classes.profileMenuUser}>
            <Typography variant='h4' weight='medium'>
              {currentUser?.firstName} {currentUser?.lastName}
            </Typography>
            <Typography
              variant='body2'
              style={{ 
                textTransform: 'capitalize',
                color: 'rgba(0, 0, 0, 0.6)',
                marginTop: 4
              }}
            >
              {currentUser?.role || 'employee'}
            </Typography>
          </div>
          <MenuItem
            className={classNames(
              classes.profileMenuItem,
              classes.headerMenuItem,
            )}
            onClick={() => {
              setProfileMenu(null);
              signOut();
            }}
          >
            <AccountIcon className={classes.profileMenuIcon} />
            <Typography>Sign Out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
