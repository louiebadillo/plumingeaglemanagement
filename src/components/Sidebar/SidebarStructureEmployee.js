import React from 'react';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  AccountCircle as ProfileIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Business as BuildingIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

// components
import Dot from './components/Dot';

// Employee sidebar structure - Limited access
const employeeStructure = [
  { id: 0, label: 'Dashboard', link: '/app/dashboard', icon: <ProfileIcon /> },
  {
    id: 1,
    label: 'Facility',
    link: '/app/facility',
    icon: <BuildingIcon />,
    children: [
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
    label: 'Daily Reports',
    link: '/app/reports',
    icon: <AssignmentIcon />,
    badge: '3',
    badgeColor: 'warning',
    children: [
      {
        label: 'My Reports',
        link: '/app/reports/my-reports',
      },
    ],
  },
  { id: 3, type: 'divider' },
  {
    id: 4,
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

export default employeeStructure;
