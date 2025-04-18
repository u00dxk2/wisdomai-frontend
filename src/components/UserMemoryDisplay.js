import React, { useEffect } from 'react';
import { getUserProfile } from '../services/userService';

/**
 * Component to load the user's memory information in the background
 * Fetches memory data but doesn't display anything
 */
const UserMemoryDisplay = () => {
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        await getUserProfile();
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    // Fetch memory data in the background
    fetchUserProfile();
  }, []);
  
  // Don't render anything
  return null;
};

export default UserMemoryDisplay; 