import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getChatHistory, deleteChat } from '../services/chatService';

const ChatHistory = ({ refreshTrigger, onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const history = await getChatHistory();
      setChats(history);
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
            button
            selected={selectedChatId === chat._id}
            onClick={() => onSelectChat(chat._id)}
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={(e) => handleDeleteChat(chat._id, e)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={chat.title || 'Untitled Chat'}
              secondary={format(new Date(chat.createdAt), 'MMM d, yyyy h:mm a')}
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