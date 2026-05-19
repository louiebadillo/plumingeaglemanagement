import React from 'react';
import {
  Person as PersonIcon,
  AccountCircle as ProfileIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BuildingIcon,
  Logout as LogoutIcon,
  Assessment as AssessmentIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { useDraftReportsCount } from '../../hooks/useDraftReportsCount';

// components
import Dot from './components/Dot';

// Admin sidebar structure - Full access
const getAdminStructure = (draftCount, locationRequestCount = 0) => [
  { id: 0, label: 'Dashboard', link: '/app/dashboard', icon: <ProfileIcon /> },
  {
    id: 1,
    label: 'Facility',
    link: '/app/facility',
    icon: <BuildingIcon />,
    children: [
      {
        label: 'Manage Facilities',
        link: '/app/facility/management',
      },
      {
        label: 'Facility A',
        link: '/app/facility/facility-a',
      },
      {
        label: 'Facility B',
        link: '/app/facility/facility-b',
      },
      {
        label: 'Facility C',
        link: '/app/facility/facility-c',
      },
    ],
  },
  {
    id: 2,
    label: 'Client Masterlist',
    link: '/app/client-masterlist',
    icon: <PersonIcon />,
  },
  {
    id: 3,
    label: 'Staff Management',
    link: '/app/staff/management',
    icon: <PeopleIcon />,
  },
  {
    id: 4,
    label: 'Daily Reports',
    link: '/app/reports',
    icon: <AssignmentIcon />,
    badge: draftCount > 0 ? draftCount.toString() : null,
    badgeColor: 'warning',
    children: [
      {
        label: 'In Progress',
        link: '/app/reports/my-reports',
      },
      {
        label: 'Submitted Reports',
        link: '/app/reports/admin-reports',
      },
    ],
  },
  {
    id: 7,
    label: 'Progress Analytics',
    link: '/app/reports/progress',
    icon: <AssessmentIcon />,
  },
  {
    id: 8,
    label: 'Location requests',
    link: '/app/location-requests',
    icon: <MyLocationIcon />,
    badge: locationRequestCount > 0 ? locationRequestCount.toString() : null,
    badgeColor: 'error',
  },
  { id: 5, type: 'divider' },
  {
    id: 6,
    label: 'Logout',
    click: function(...rest) {
      const name = 'onLogout'
      rest.forEach(c => {
        if (c.clickName === name) {
          return c()
        }
        return false
      })
    },
    icon: <LogoutIcon />,
  },
];

// Hook-based component for dynamic sidebar
const AdminSidebarStructure = () => {
  const { draftCount } = useDraftReportsCount();
  return getAdminStructure(draftCount, 0);
};

export { getAdminStructure };
export default AdminSidebarStructure;
