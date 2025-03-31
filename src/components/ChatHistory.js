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
  const prevActiveChatIdRef = useRef(null);
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

  const loadChatHistory = useCallback(async () => {
    // Clear any pending load timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

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
  }, []);

  // Load chat history when component mounts or refreshTrigger changes
  useEffect(() => {
    console.log('ChatHistory refreshTrigger changed:', refreshTrigger);
    console.log('Current activeChatId:', activeChatId, 'selectedChatId:', selectedChatId);
    
    // Always load history when refresh is triggered
    // This makes sure we see new/updated chats immediately
    console.log('Refreshing chat history from trigger');
    loadChatHistory();
  }, [refreshTrigger, loadChatHistory, activeChatId, selectedChatId]);

  // When selected chat ID changes (usually from clicking "New Chat" or selecting a chat)
  useEffect(() => {
    console.log('selectedChatId changed to:', selectedChatId);
    
    // If we've deselected all chats (e.g., New Chat button), refresh the history
    if (selectedChatId === null) {
      console.log('selectedChatId cleared, refreshing history');
      loadChatHistory();
    }
  }, [selectedChatId, loadChatHistory]);

  // When activeChatId changes and isn't null, also refresh
  useEffect(() => {
    console.log('activeChatId changed to:', activeChatId);
    if (activeChatId) {
      prevActiveChatIdRef.current = activeChatId;
      console.log('Loading chat history due to activeChatId change');
      loadChatHistory();
    }
  }, [activeChatId, loadChatHistory]);

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
      await loadChatHistory();
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading chat history...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Chat History
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
        {chats.length === 0 && (
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