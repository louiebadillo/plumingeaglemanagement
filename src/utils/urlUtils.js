// Utility functions for URL handling

/**
 * Converts a client name to a URL-friendly slug
 * @param {string} firstName - Client's first name
 * @param {string} lastName - Client's last name
 * @returns {string} URL-friendly slug (e.g., "john-smith")
 */
export const createClientSlug = (firstName, lastName) => {
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }
  
  const fullName = `${firstName} ${lastName}`;
  return fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Extracts client name from a URL slug
 * @param {string} slug - URL slug (e.g., "john-smith" or "test-client-client-last-name")
 * @returns {object} Object with firstName and lastName
 */
export const parseClientSlug = (slug) => {
  if (!slug) {
    throw new Error('Slug is required');
  }
  
  const nameParts = slug.split('-');
  
  if (nameParts.length < 2) {
    throw new Error('Invalid client slug format');
  }
  
  // Use the most common case: assume last part is last name
  // This maintains backward compatibility
  const lastName = nameParts[nameParts.length - 1];
  const firstNameParts = nameParts.slice(0, -1);
  
  return {
    firstName: firstNameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1)
  };
};

/**
 * Creates a client URL using the client's name
 * @param {object} client - Client object with first_name and last_name
 * @param {string} action - Optional action (e.g., 'edit')
 * @returns {string} Client URL
 */
export const createClientUrl = (client, action = null) => {
  if (!client || !client.first_name || !client.last_name) {
    throw new Error('Client object with first_name and last_name is required');
  }
  
  const slug = createClientSlug(client.first_name, client.last_name);
  const baseUrl = `/app/client/${slug}`;
  
  return action ? `${baseUrl}/${action}` : baseUrl;
};
