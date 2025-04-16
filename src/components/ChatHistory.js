import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getChatHistory, deleteChat } from '../services/chatService';

const ChatHistory = ({ refreshTrigger, onSelectChat, selectedChatId, activeChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevRefreshTriggerRef = useRef(refreshTrigger);
  const loadTimeoutRef = useRef(null);

  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return null;
      }

      // Try to parse the ISO string
      const date = parseISO(dateString);
      
      // Validate the parsed date
      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateString);
        return null;
      }

      // Format the date
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      console.error('Error formatting date:', err, 'Date string:', dateString);
      return null;
    }
  };

  const loadChatHistory = useCallback(async (immediate = false) => {
    // Clear any pending load timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Function to execute the actual loading
    const executeLoad = async () => {
      try {
        setLoading(true);
        const history = await getChatHistory();
        
        // Process each chat to include formatted dates
        const processedHistory = history.map(chat => {
          return {
            ...chat,
            formattedDate: formatDate(chat.updatedAt) || 'Date not available'
          };
        });
        
        setChats(processedHistory);
      } catch (err) {
        console.error('Error loading chat history:', err);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    // Either load immediately or with a debounce timeout
    if (immediate) {
      executeLoad();
    } else {
      // 300ms debounce to prevent rapid consecutive reloads
      loadTimeoutRef.current = setTimeout(executeLoad, 300);
    }
  }, []);

  // Consolidate all refresh triggers into a single effect with debounce
  useEffect(() => {
    console.log('ChatHistory refresh triggered:', 
      refreshTrigger !== prevRefreshTriggerRef.current ? 'By refreshTrigger change' : 
      'By other state change');
    
    console.log('Current activeChatId:', activeChatId, 'selectedChatId:', selectedChatId);
    
    // Update the ref for the next render
    prevRefreshTriggerRef.current = refreshTrigger;
    
    // Load chat history
    // Use immediate loading for initial load (refreshTrigger === 0)
    const immediate = refreshTrigger === 0;
    loadChatHistory(immediate);
    
  }, [refreshTrigger, loadChatHistory, activeChatId, selectedChatId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation();
    try {
      await deleteChat(chatId);
      await loadChatHistory(true); // Immediate reload after delete
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Chat History {loading && <span>(Refreshing...)</span>}
      </Typography>
      <List>
        {chats.map((chat) => (
          <ListItem
            key={chat._id}
            onClick={() => onSelectChat(chat._id)}
            selected={selectedChatId === chat._id || activeChatId === chat._id}
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={(e) => handleDeleteChat(chat._id, e)}
              >
                <DeleteIcon />
              </IconButton>
            }
            sx={{ 
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemText
              primary={chat.title || 'Untitled Chat'}
              secondary={
                <Tooltip title={chat.updatedAt || 'No date available'}>
                  <Typography 
                    variant="caption" 
                    component="span"
                    sx={{ color: 'text.secondary' }}
                  >
                    {chat.formattedDate}
                  </Typography>
                </Tooltip>
              }
            />
          </ListItem>
        ))}
        {chats.length === 0 && !loading && (
          <ListItem>
            <ListItemText
              primary="No chat history"
              secondary="Start a new chat to begin"
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default ChatHistory; 