import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getChatHistory, deleteChat } from '../services/chatService';

const ChatHistory = ({ refreshTrigger, onSelectChat, selectedChatId, activeChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const prevRefreshTriggerRef = useRef(refreshTrigger);
  const loadTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

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
        // Only set loading state on initial load, not refreshes
        if (chats.length === 0) {
          setLoading(true);
        }
        
        const history = await getChatHistory();
        
        if (!isMountedRef.current) return;
        
        // Process each chat to include formatted dates
        const processedHistory = history.map(chat => {
          return {
            ...chat,
            formattedDate: formatDate(chat.updatedAt) || 'Date not available'
          };
        });
        
        // Use transitions for smoother updates
        startTransition(() => {
          // Set the new chats
          setChats(processedHistory);
          setLoading(false);
          setError(null);
        });
      } catch (err) {
        if (!isMountedRef.current) return;
        
        console.error('Error loading chat history:', err);
        setChats([]);
        setError('Failed to load chat history');
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
  }, [chats.length]);

  // Create a stable, memoized debounced version of the loadChatHistory function
  const debouncedLoadChatHistory = useCallback(
    (shouldRefresh = false) => {
      loadChatHistory(shouldRefresh);
    },
    [loadChatHistory]
  );

  // Monitor refresh triggers and handle updates
  useEffect(() => {
    const triggerChanged = refreshTrigger !== prevRefreshTriggerRef.current;
    
    // Update the ref for the next render
    prevRefreshTriggerRef.current = refreshTrigger;
    
    // Load chat history
    // Use immediate loading for initial load (refreshTrigger === 0)
    const immediate = refreshTrigger === 0 || triggerChanged;
    debouncedLoadChatHistory(immediate);
    
  }, [refreshTrigger, debouncedLoadChatHistory]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation();
    try {
      await deleteChat(chatId);
      debouncedLoadChatHistory(true); // Immediate reload after delete
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete chat');
    }
  };

  // Memoize individual chat item to prevent unnecessary re-renders
  const ChatItem = React.memo(({ chat }) => {
    const isSelected = selectedChatId === chat._id || activeChatId === chat._id;
    
    return (
      <ListItem
        onClick={() => onSelectChat(chat._id)}
        selected={isSelected}
        secondaryAction={
          <IconButton 
            edge="end" 
            aria-label="delete"
            onClick={(e) => handleDeleteChat(chat._id, e)}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
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
          },
          transition: 'background-color 0.2s ease',
          borderRadius: '4px',
          my: 0.5
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
    );
  });

  // Render loading spinner when data is being fetched
  if (loading && chats.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error message if there's an error
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'opacity 0.3s ease',
      opacity: isPending ? 0.9 : 1
    }}>
      <Typography variant="h6" sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        Chat History
        {loading && chats.length > 0 && (
          <CircularProgress size={16} sx={{ ml: 1 }} />
        )}
      </Typography>
      
      <List sx={{ 
        overflowY: 'auto',
        flexGrow: 1,
        px: 1
      }}>
        {chats.map(chat => (
          <ChatItem key={chat._id} chat={chat} />
        ))}
        
        {chats.length === 0 && !loading && (
          <ListItem sx={{ justifyContent: 'center', opacity: 0.7 }}>
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

export default React.memo(ChatHistory); 