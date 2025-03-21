import React, { useState, useEffect, useRef } from 'react';
import { saveMessage, getChatMessages } from '../services/chatService';
import { getAuthToken } from '../utils/auth';
import ChatHistory from './ChatHistory';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Container
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import WisdomSelector from './WisdomSelector';

const Chat = ({ selectedFigure, setFigure, onChatUpdated, selectedChatId, onSelectChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChatId) {
      loadChatMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  const loadChatMessages = async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      const chat = await getChatMessages(chatId);
      setMessages(chat.messages);
    } catch (err) {
      console.error('Error loading chat messages:', err);
      if (err.response?.status === 429) {
        // If rate limited, wait 2 seconds and try again
        setError('Rate limited. Retrying in 2 seconds...');
        setTimeout(() => {
          loadChatMessages(chatId);
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load chat messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input.trim()
    };

    try {
      setLoading(true);
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setError(null);

      // Save user message to chat history
      const chat = await saveMessage(selectedChatId, userMessage, selectedFigure);
      onSelectChat(chat._id);
      
      // Notify parent component to refresh chat history
      if (onChatUpdated) {
        onChatUpdated();
      }

      // Create EventSource URL with authentication token
      const eventSourceUrl = new URL(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/chat/stream`);
      eventSourceUrl.searchParams.append('message', userMessage.content);
      eventSourceUrl.searchParams.append('wisdomFigure', selectedFigure);
      eventSourceUrl.searchParams.append('token', getAuthToken());
      
      const eventSource = new EventSource(eventSourceUrl.toString());
      let assistantMessage = '';

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Stream message received:', data);

          if (data.content) {
            assistantMessage += data.content;
            setMessages(prev => {
              const historyWithoutLastAssistantMessage = prev.filter(entry => 
                entry.role !== "assistant" || entry !== prev[prev.length - 1]
              );
              return [...historyWithoutLastAssistantMessage, { 
                role: "assistant", 
                content: assistantMessage,
                figure: selectedFigure
              }];
            });
          }

          if (data.done) {
            eventSource.close();
            // Save AI response to chat history
            const assistantResponse = { 
              role: 'assistant', 
              content: assistantMessage,
              figure: selectedFigure
            };
            await saveMessage(chat._id, assistantResponse, selectedFigure);
            if (onChatUpdated) {
              onChatUpdated();
            }
            setLoading(false);
          }
        } catch (err) {
          console.error('Error processing stream message:', err);
          setError('Error processing response');
          eventSource.close();
          setLoading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        setError('Failed to get response from wisdom figure');
        setLoading(false);
        eventSource.close();
      };
    } catch (err) {
      console.error('Error in message flow:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    onSelectChat(null);
    if (onChatUpdated) {
      onChatUpdated();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: message.role === 'user' ? 'primary.light' : 'grey.100',
              borderRadius: 1
            }}
          >
            {message.role === 'assistant' && (
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                {message.figure || selectedFigure}
              </Typography>
            )}
            <Typography>{message.content}</Typography>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ mb: 2, width: '100%' }}>
        <WisdomSelector
          figure={selectedFigure}
          setFigure={setFigure}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => {
            setMessages([]);
            onSelectChat(null);
            if (onChatUpdated) onChatUpdated();
          }}
          startIcon={<AddIcon />}
        >
          New Chat
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => setMessages([])}
          startIcon={<ClearIcon />}
        >
          Clear Chat
        </Button>
      </Box>
    </Box>
  );
};

export default Chat; 