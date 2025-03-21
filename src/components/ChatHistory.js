import React, { useState, useEffect } from 'react';
import { getChatHistory, deleteChat } from '../services/chatService';
import { formatDistanceToNow } from 'date-fns';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Box,
  Divider,
  Tooltip,
  ListItemButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { CircularProgress, Alert } from '@mui/material';

const ChatHistory = ({ onSelectChat, selectedChatId, refreshTrigger }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadChatHistory();
  }, [refreshTrigger]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getChatHistory();
      setChats(history);
      setRetryCount(0); // Reset retry count on successful load
    } catch (err) {
      console.error('Error loading chat history:', err);
      if (err.response?.status === 429 && retryCount < 3) {
        // If rate limited and haven't retried too many times, try again after a delay
        setRetryCount(prev => prev + 1);
        const retryDelay = (retryCount + 1) * 2000; // Exponential backoff
        setTimeout(() => {
          loadChatHistory();
        }, retryDelay);
        setError(`Rate limited. Retrying in ${retryDelay/1000} seconds...`);
      } else {
        setError(err.response?.data?.message || 'Failed to load chat history');
      }
    } finally {
      if (retryCount === 0) { // Only clear loading if not retrying
        setLoading(false);
      }
    }
  };

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation();
    try {
      await deleteChat(chatId);
      setChats(chats.filter(chat => chat._id !== chatId));
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError(err.response?.data?.message || 'Failed to delete chat');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <Box sx={{ width: '100%', maxHeight: '100vh', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2 }}>Chat History</Typography>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <CircularProgress size={20} />
          {retryCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Retry attempt {retryCount}/3...
            </Typography>
          )}
        </Box>
      )}
      {error && (
        <Alert 
          severity={retryCount > 0 ? "info" : "error"} 
          sx={{ m: 2 }}
          action={
            retryCount === 0 && (
              <IconButton
                color="inherit"
                size="small"
                onClick={loadChatHistory}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            )
          }
        >
          {error}
        </Alert>
      )}
      <List>
        {chats.map((chat) => (
          <ListItem 
            key={chat._id}
            disablePadding
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <ListItemButton
              onClick={() => onSelectChat(chat._id)}
              selected={selectedChatId === chat._id}
              sx={{
                py: 2,
                px: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  }
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" noWrap>
                    {chat.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(chat.updatedAt)}
                  </Typography>
                }
              />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => handleDeleteChat(chat._id, e)}
                sx={{
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    color: 'error.main'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
        {chats.length === 0 && !loading && (
          <ListItem>
            <ListItemText
              primary={
                <Typography color="text.secondary" align="center">
                  No chats yet
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default ChatHistory; 