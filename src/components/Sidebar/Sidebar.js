import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, List, Box } from '@mui/material';
import { useTheme } from '@mui/material';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

// styles
import useStyles from './styles';

// components
import SidebarLink from './components/SidebarLink/SidebarLink';

// images - using public path
const logo = '/pellogofinal.png';

// context
import {
  useLayoutState,
} from '../../context/LayoutContext';

function Sidebar({ location, structure }) {
  let classes = useStyles();
  let theme = useTheme();

  const toggleDrawer = (value) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    // Sidebar is always open, so no action needed
  };

  // global
  let { isSidebarOpened } = useLayoutState();

  // local
  let [isPermanent, setPermanent] = useState(true);

  // Sidebar is always opened (uncompressed)
  const isSidebarOpenedWrapper = useMemo(
    () => true, // Always return true to keep sidebar open
    [],
  );

  useEffect(function () {
    window.addEventListener('resize', handleWindowWidthChange);
    handleWindowWidthChange();
    return function cleanup() {
      window.removeEventListener('resize', handleWindowWidthChange);
    };
  });

  return (
    <Drawer
      variant={isPermanent ? 'permanent' : 'temporary'}
      className={classNames(classes.drawer, {
        [classes.drawerOpen]: isSidebarOpenedWrapper,
        [classes.drawerClose]: !isSidebarOpenedWrapper,
      })}
      classes={{
        paper: classNames({
          [classes.drawerOpen]: isSidebarOpenedWrapper,
          [classes.drawerClose]: !isSidebarOpenedWrapper,
        }),
      }}
      open={isSidebarOpenedWrapper}
      onClose={toggleDrawer(true)}
    >
      <div className={classes.toolbar} />
      
      {/* Logo Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <img 
          src={logo} 
          alt="Pluming Eagle Lodge" 
          style={{ 
            maxWidth: isSidebarOpenedWrapper ? '120px' : '40px',
            height: 'auto',
            transition: 'max-width 0.3s ease'
          }} 
        />
      </Box>
      
      <List
        className={classes.sidebarList}
        classes={{ padding: classes.padding }}
      >
        {structure.map(link => (
          <SidebarLink
            key={link.id}
            location={location}
            isSidebarOpened={!isPermanent ? !isSidebarOpened : isSidebarOpened}
            {...link}
            toggleDrawer={toggleDrawer(true)}
          />
        ))}
      </List>
    </Drawer>
  );

  // ##################################################################
  function handleWindowWidthChange() {
    let windowWidth = window.innerWidth;
    let breakpointWidth = theme.breakpoints.values.md;
    let isSmallScreen = windowWidth < breakpointWidth;

    if (isSmallScreen && isPermanent) {
      setPermanent(false);
    } else if (!isSmallScreen && !isPermanent) {
      setPermanent(true);
    }
  }
}

export default withRouter(Sidebar);
