import React from 'react';
import {
  Home as HomeIcon,
  FilterNone as UIElementsIcon,
  BorderAll as TableIcon,
  LibraryBooks as LibraryIcon,
  BarChart as ChartIcon,
  Map as MapIcon,
  Apps as CoreIcon,
  Description as DescriptionIcon,
  ShoppingCart as ShoppingCartIcon,
  StarBorder as ExtraIcon,
  AddCircle as AddSectionIcon,
  FolderOpen as FolderIcon,
  Person as PersonIcon,
  AccountCircle as ProfileIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BuildingIcon,
  Announcement as AnnouncementIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import ViewCompactRoundedIcon from '@mui/icons-material/ViewCompactRounded';

// components
import Dot from './components/Dot';

// Admin sidebar structure - Full access
const adminStructure = [
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
    label: 'Staff Management',
    link: '/app/staff/management',
    badge: 'Admin',
    badgeColor: 'secondary',
    icon: <PeopleIcon />,
  },
  {
    id: 3,
    label: 'Daily Reports',
    link: '/app/reports',
    icon: <AssignmentIcon />,
    badge: '5',
    badgeColor: 'warning',
    children: [
      {
        label: 'My Reports',
        link: '/app/reports/my-reports',
      },
      {
        label: 'All Reports',
        link: '/app/reports/all-reports',
      },
    ],
  },
  {
    id: 4,
    label: 'Announcements',
    link: '/app/announcements/management',
    badge: 'Admin',
    badgeColor: 'secondary',
    icon: <AnnouncementIcon />,
  },
  { id: 5, type: 'divider' },
  { id: 6, type: 'title', label: 'TEMPLATE' },
  {
    id: 7,
    label: 'Core',
    link: '/app/core',
    icon: <CoreIcon />,
    children: [
      { label: 'Typography', link: '/app/core/typography' },
      { label: 'Colors', link: '/app/core/colors' },
      { label: 'Grid', link: '/app/core/grid' },
    ],
  },
  {
    id: 8,
    label: 'Tables',
    link: '/app/tables',
    icon: <TableIcon />,
    children: [
      { label: 'Static Tables', link: '/app/tables/static' },
      { label: 'Dynamic Tables', link: '/app/tables/dynamic' },
    ],
  },
  {
    id: 9,
    label: 'Charts',
    link: '/app/charts',
    icon: <ChartIcon />,
    children: [
      { label: 'Overview', link: '/app/charts/overview' },
      { label: 'Line Charts', link: '/app/charts/line' },
      { label: 'Bar Charts', link: '/app/charts/bar' },
      { label: 'Pie Charts', link: '/app/charts/pie' },
    ],
  },
  { id: 10, type: 'divider' },
  {
    id: 11,
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

export default adminStructure;
