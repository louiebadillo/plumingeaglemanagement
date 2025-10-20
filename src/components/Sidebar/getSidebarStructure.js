import adminStructure from './SidebarStructureAdmin';
import employeeStructure from './SidebarStructureEmployee';
import { Settings as SettingsIcon } from '@mui/icons-material';

/**
 * Get sidebar structure based on user role
 * @param {string} userRole - The role of the current user
 * @param {Array} facilities - Array of facilities from Supabase
 * @returns {Array} - The appropriate sidebar structure
 */
export function getSidebarStructure(userRole, facilities = []) {
  let structure;
  
  switch (userRole) {
    case 'admin':
      structure = [...adminStructure];
      break;
    case 'employee':
      structure = [...employeeStructure];
      break;
    default:
      structure = [...employeeStructure]; // Default to employee structure
  }

  // Find the facility menu item and update it with real facilities
  const facilityMenuItem = structure.find(item => item.label === 'Facility');
  if (facilityMenuItem && facilityMenuItem.children) {
    if (userRole === 'admin') {
      // Admin gets "Manage Facilities" + all facilities
      facilityMenuItem.children = [
        {
          label: 'Manage Facilities',
          link: '/app/facility/management',
          icon: <SettingsIcon />,
        },
        ...facilities.map(facility => ({
          label: facility.name,
          link: `/app/facility/${facility.id}`,
        }))
      ];
    } else {
      // Employee gets only the facilities they can access
      facilityMenuItem.children = facilities.map(facility => ({
        label: facility.name,
        link: `/app/facility/${facility.id}`,
      }));
    }
  }

  return structure;
}

export default getSidebarStructure;
