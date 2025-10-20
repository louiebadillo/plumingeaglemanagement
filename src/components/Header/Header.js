import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material';
import {
  Menu as MenuIcon,
  Person as AccountIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import classNames from 'classnames';

//images
import profile from '../../images/main-profile.png';
import { getConfig } from '../../config/template';

// styles
import useStyles from './styles';

// components
import { Typography, Avatar } from '../Wrappers/Wrappers';

// context
import {
  useLayoutState,
  useLayoutDispatch,
  toggleSidebar,
} from '../../context/LayoutContext';
import { useSupabase } from '../../context/SupabaseContext';

export default function Header(props) {
  let classes = useStyles();
  let theme = useTheme();

  // global
  let layoutState = useLayoutState();
  let layoutDispatch = useLayoutDispatch();
  const { userProfile, signOut } = useSupabase();

  // local
  const [profileMenu, setProfileMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState();
  const [isSmall, setSmall] = useState(false);


  useEffect(() => {
    // User data is now handled by Supabase context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userProfile) {
      setCurrentUser({
        firstName: userProfile.first_name || 'Admin',
        lastName: userProfile.last_name || 'User',
        avatar: null
      });
    } else {
      // Default user data
      setCurrentUser({
        firstName: 'Admin',
        lastName: 'User',
        avatar: null
      });
    }
  }, [userProfile]);

  useEffect(function () {
    window.addEventListener('resize', handleWindowWidthChange);
    handleWindowWidthChange();
    return function cleanup() {
      window.removeEventListener('resize', handleWindowWidthChange);
    };
  });

  function handleWindowWidthChange() {
    let windowWidth = window.innerWidth;
    let breakpointWidth = theme.breakpoints.values.md;
    let isSmallScreen = windowWidth < breakpointWidth;
    setSmall(isSmallScreen);
  }

  return (
    <AppBar position='fixed' className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <IconButton
          color='default'
          onClick={() => toggleSidebar(layoutDispatch)}
          className={classNames(
            classes.headerMenuButton,
            classes.headerMenuButtonCollapse,
          )}
        >
          {(!layoutState.isSidebarOpened && isSmall) ||
          (layoutState.isSidebarOpened && !isSmall) ? (
            <ArrowBackIcon
              classes={{
                root: classNames(
                  classes.headerIcon,
                  classes.headerIconCollapse,
                ),
              }}
            />
          ) : (
            <MenuIcon
              classes={{
                root: classNames(
                  classes.headerIcon,
                  classes.headerIconCollapse,
                ),
              }}
            />
          )}
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
              className={classes.profileMenuLink}
              component='a'
              color='primary'
              href='https://flatlogic.com'
            >
              Flatlogic.com
            </Typography>
          </div>
          <MenuItem
            className={classNames(
              classes.profileMenuItem,
              classes.headerMenuItem,
            )}
          >
            <AccountIcon className={classes.profileMenuIcon} />
            <Link to='/app/user/edit' style={{ textDecoration: 'none' }}>
              Profile
            </Link>
          </MenuItem>
          <div className={classes.profileMenuUser}>
            <Typography
              className={classes.profileMenuLink}
              color='primary'
              onClick={() => signOut()}
            >
              Sign Out
            </Typography>
          </div>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
