import adminStructure from './SidebarStructureAdmin';
import employeeStructure from './SidebarStructureEmployee';

/**
 * Get sidebar structure based on user role
 * @param {string} userRole - The role of the current user
 * @returns {Array} - The appropriate sidebar structure
 */
export function getSidebarStructure(userRole) {
  switch (userRole) {
    case 'admin':
      return adminStructure;
    case 'employee':
      return employeeStructure;
    default:
      return employeeStructure; // Default to employee structure
  }
}

/**
 * Get user role from localStorage or current user context
 * @returns {string} - The current user's role
 */
export function getCurrentUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // If no user or invalid user, default to admin for initial setup
    if (!user.role || !user.firstName) {
      return 'admin';
    }
    return user.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'admin';
  }
}

export default getSidebarStructure;
