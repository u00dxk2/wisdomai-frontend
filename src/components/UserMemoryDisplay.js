import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/userService';

/**
 * Component to load the user's memory information in the background
 * Fetches memory data but doesn't display anything
 */
const UserMemoryDisplay = () => {
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
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