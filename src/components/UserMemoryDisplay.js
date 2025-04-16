import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { getUserProfile } from '../services/userService';

/**
 * Component to display the user's memory information
 * Shows personal facts and topics the AI remembers about the user
 */
const UserMemoryDisplay = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  if (loading) {
    return null; // Don't show anything while loading
  }
  
  // If no memory data or no facts, don't display the component
  if (!userProfile || !userProfile.memory || 
      (!userProfile.memory.personalFacts?.length && !userProfile.memory.recentTopics?.length)) {
    return null;
  }
  
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: '#f8f9fa',
        borderLeft: '3px solid #6c5ce7',
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: '#333' }}>
        Wisdom Triangle remembers:
      </Typography>
      
      {userProfile.memory.personalFacts?.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <List dense disablePadding>
            {userProfile.memory.personalFacts.map((fact, index) => (
              <ListItem key={index} disablePadding disableGutters sx={{ py: 0.5 }}>
                <ListItemText 
                  primary={fact}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {userProfile.memory.recentTopics?.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Recent topics:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {userProfile.memory.recentTopics.map((topic, index) => (
              <Chip 
                key={index} 
                label={topic} 
                size="small" 
                variant="outlined"
                sx={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }} 
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default UserMemoryDisplay; 