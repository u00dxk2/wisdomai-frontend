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
import { Send as SendIcon } from '@mui/icons-material';

const Chat = ({ selectedFigure }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
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
      const chat = await getChatMessages(chatId);
      setMessages(chat.messages);
      setError(null);
    } catch (err) {
      setError('Failed to load chat messages');
      console.error('Error loading chat messages:', err);
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
      content: input
    };

    try {
      setLoading(true);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Save user message to chat history
      const chat = await saveMessage(selectedChatId, userMessage);
      setSelectedChatId(chat._id);

      // Create EventSource URL with authentication token
      const eventSourceUrl = new URL(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/chat-stream`);
      eventSourceUrl.searchParams.append('message', userMessage.content);
      eventSourceUrl.searchParams.append('wisdomFigure', selectedFigure);
      eventSourceUrl.searchParams.append('token', getAuthToken());
      
      const eventSource = new EventSource(eventSourceUrl);
      let assistantMessage = '';

      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);

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
          await saveMessage(chat._id, { 
            role: 'assistant', 
            content: assistantMessage,
            figure: selectedFigure
          });
          setLoading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        setError('Failed to get response');
        setLoading(false);
        eventSource.close();
      };
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ChatHistory
            onSelectChat={setSelectedChatId}
            selectedChatId={selectedChatId}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper elevation={2}>
            <Box p={2} height="70vh" display="flex" flexDirection="column">
              <Box flexGrow={1} overflow="auto" mb={2}>
                {error && (
                  <Typography color="error" align="center" gutterBottom>
                    {error}
                  </Typography>
                )}
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    mb={2}
                    alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    maxWidth="70%"
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        backgroundColor: message.role === 'user' ? 'primary.light' : 'grey.100',
                        color: message.role === 'user' ? 'white' : 'text.primary'
                      }}
                    >
                      {message.role === 'assistant' && message.figure && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                          {message.figure}
                        </Typography>
                      )}
                      <Typography>{message.content}</Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  sx={{ minWidth: '100px' }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <SendIcon />
                    </>
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Chat; 