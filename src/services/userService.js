/**
 * Service for user-related API calls
 */
import { getAuthToken } from '../utils/auth';

/**
 * Fetch the current user's profile with memory information
 * @returns {Promise<Object>} User profile with memory data
 */
export const getUserProfile = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}; 