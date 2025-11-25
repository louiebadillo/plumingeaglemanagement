import React from 'react';
import {
  AccountCircle as ProfileIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useDraftReportsCount } from '../../hooks/useDraftReportsCount';

// components
import Dot from './components/Dot';

// Employee sidebar structure - Limited access
const getEmployeeStructure = (draftCount) => [
  { id: 0, label: 'Dashboard', link: '/app/dashboard', icon: <ProfileIcon /> },
  {
    id: 1,
    label: 'Daily Reports',
    link: '/app/reports',
    icon: <AssignmentIcon />,
    badge: draftCount > 0 ? draftCount.toString() : null,
    badgeColor: 'warning',
    children: [
      {
        label: 'My Reports',
        link: '/app/reports/my-reports',
      },
    ],
  },
  { id: 2, type: 'divider' },
  {
    id: 3,
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
const EmployeeSidebarStructure = () => {
  const { draftCount } = useDraftReportsCount();
  return getEmployeeStructure(draftCount);
};

export { getEmployeeStructure };
export default EmployeeSidebarStructure;
