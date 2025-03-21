import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import WisdomSelector from './WisdomSelector';
import { getChatMessages, sendMessage, clearChat } from '../services/chatService';

const Chat = ({ selectedFigure, setFigure, onChatUpdated, selectedChatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatMessages = async () => {
    try {
      if (selectedChatId) {
        const chatMessages = await getChatMessages(selectedChatId);
        setMessages(chatMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
    }
  };

  useEffect(() => {
    loadChatMessages();
    scrollToBottom();
  }, [selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const response = await sendMessage(newMessage, selectedFigure);
      setMessages(prev => [...prev, 
        { role: 'user', content: newMessage },
        { role: 'assistant', content: response.message }
      ]);
      setNewMessage('');
      onChatUpdated();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    onChatUpdated();
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
      setMessages([]);
      onChatUpdated();
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                color: message.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              {message.role === 'assistant' && (
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {selectedFigure}
                </Typography>
              )}
              <Typography>{message.content}</Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <WisdomSelector selectedFigure={selectedFigure} setFigure={setFigure} />

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={loading || !newMessage.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Send'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleNewChat} fullWidth>
          New Chat
        </Button>
        <Button variant="outlined" onClick={handleClearChat} fullWidth>
          Clear Chat
        </Button>
      </Box>
    </Box>
  );
};

export default Chat; 