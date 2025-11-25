import { getAdminStructure } from './SidebarStructureAdmin';
import { getEmployeeStructure } from './SidebarStructureEmployee';
import { Settings as SettingsIcon } from '@mui/icons-material';

/**
 * Get sidebar structure based on user role
 * @param {string} userRole - The role of the current user
 * @param {Array} facilities - Array of facilities from Supabase
 * @param {number} draftCount - Number of draft reports for employees
 * @returns {Array} - The appropriate sidebar structure
 */
export function getSidebarStructure(userRole, facilities = [], draftCount = 0) {
  let structure;
  
  switch (userRole) {
    case 'admin':
      structure = [...getAdminStructure(draftCount)];
      break;
    case 'employee':
      structure = [...getEmployeeStructure(draftCount)];
      break;
    default:
      structure = [...getEmployeeStructure(draftCount)]; // Default to employee structure
  }

  // Find the facility menu item and update it with real facilities (only for admins)
  if (userRole === 'admin') {
    const facilityMenuItem = structure.find(item => item.label === 'Facility');
    if (facilityMenuItem && facilityMenuItem.children) {
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
    }
  }

  return structure;
}

export default getSidebarStructure;
