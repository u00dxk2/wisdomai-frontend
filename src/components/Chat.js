import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WisdomSelector from './WisdomSelector';
import { getChatMessages, sendMessage, clearChat } from '../services/chatService';

const Chat = ({ selectedFigure, setFigure, onChatUpdated, selectedChatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);
  const cleanupRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatMessages = async () => {
    try {
      if (selectedChatId) {
        const chatMessages = await getChatMessages(selectedChatId);
        setMessages(chatMessages || []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
    }
  };

  useEffect(() => {
    loadChatMessages();
    // When selectedChatId changes, log information about the change
    console.log('Selected chat changed to:', selectedChatId);
  }, [selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // This is an important fix: when chat ID appears in the response,
  // update our local selectedChatId to match it
  useEffect(() => {
    if (selectedChatId === null && messages.length > 0) {
      console.log('We have messages but no selectedChatId - something might be wrong');
    }
  }, [selectedChatId, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Cleanup function for when component unmounts or when starting a new chat
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isTyping) return;

    // Clean up any existing streams
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const userMessage = {
      role: 'user',
      content: newMessage.trim()
    };

    // Add user message to state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setStreamingText('');
    
    try {
      console.log('Sending message with selectedChatId:', selectedChatId);
      
      // If selectedChatId is null, this means we're creating a new chat
      if (!selectedChatId) {
        console.log('This will create a new chat');
      } else {
        console.log('This will add to existing chat:', selectedChatId);
      }
      
      // Send the message and get streaming setup
      const { setupStream, chatId } = await sendMessage(selectedChatId, userMessage, selectedFigure);
      
      console.log('Message sent, received chatId:', chatId);
      
      // Track our current chat ID and update parent component
      let currentChatId = chatId;
      
      // For new chats or if the chat ID changed, update our internal tracking
      if (!selectedChatId || selectedChatId !== chatId) {
        console.log('Updating selectedChatId after message sent:', chatId);
        currentChatId = chatId;
      }
      
      // Notify parent that a chat has been created or updated with user message
      // This ensures the chat appears in history immediately after user sends a message
      onChatUpdated(currentChatId);
      
      // Set up the stream handlers
      const cleanup = setupStream(
        // onChunk - called for each chunk of the response
        (chunk, fullText) => {
          setStreamingText(fullText);
        },
        // onDone - called when streaming is complete
        (finalText) => {
          // Add the complete message to the messages array
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: 'assistant',
              content: finalText,
              figure: selectedFigure
            }
          ]);
          
          // Clear the streaming state
          setStreamingText('');
          setIsTyping(false);
          
          // Clear the cleanup function
          cleanupRef.current = null;
          
          // Notify parent that the chat has been updated with the complete response
          // This ensures the chat history is updated after the complete response
          onChatUpdated(currentChatId);
        },
        // onError - called if there's an error with the stream
        (error) => {
          console.error('Stream error:', error);
          setIsTyping(false);
          setStreamingText('');
          
          // Add an error message
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: 'system',
              content: 'Error: Failed to get response. Please try again.'
            }
          ]);
          
          // Clear the cleanup function
          cleanupRef.current = null;
        }
      );
      
      // Store the cleanup function for later
      cleanupRef.current = cleanup;

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Add an error message
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'system',
          content: 'Error: Failed to get response. Please try again.'
        }
      ]);
    }
  };

  const handleNewChat = () => {
    // Clean up any existing streams
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // Clear messages in the current UI
    setMessages([]);
    setStreamingText('');
    setIsTyping(false);
    
    // This is critical: We need to tell the parent component to clear the selectedChatId
    // so that the next message actually creates a new chat instead of adding to the current one
    console.log('Creating new chat, clearing selectedChatId');
    onChatUpdated(null);
  };

  const handleClearChat = async () => {
    try {
      // Check if there's a selected chat
      if (!selectedChatId) {
        console.log('No chat selected to clear');
        return;
      }
      
      // Clean up any existing streams
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      console.log('Clearing chat with ID:', selectedChatId);
      await clearChat(selectedChatId);
      
      // Clear local messages
      setMessages([]);
      setStreamingText('');
      setIsTyping(false);
      
      // Keep the same chat ID but ensure the UI is refreshed
      onChatUpdated(selectedChatId);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 2,
      bgcolor: 'background.default' 
    }}>
      {/* Messages area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2 
      }}>
        {/* Regular messages */}
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              px: 2
            }}
          >
            <Paper
              sx={{
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                bgcolor: message.role === 'user' ? 'primary.light' : 
                        message.role === 'system' ? 'error.light' : 'grey.100',
                color: message.role === 'user' ? 'text.primary' : 'text.secondary'
              }}
            >
              {message.role === 'assistant' && (
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {message.figure || selectedFigure}
                </Typography>
              )}
              <Typography>{message.content}</Typography>
            </Paper>
          </Box>
        ))}
        
        {/* Streaming message */}
        {isTyping && streamingText && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              px: 2
            }}
          >
            <Paper
              sx={{
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.100',
                color: 'text.secondary'
              }}
            >
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {selectedFigure}
              </Typography>
              <Typography>{streamingText}</Typography>
            </Paper>
          </Box>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Wisdom selector */}
      <Box sx={{ mb: 2 }}>
        <WisdomSelector 
          figure={selectedFigure} 
          setFigure={setFigure} 
          disabled={isTyping}
        />
      </Box>

      {/* Message input and buttons */}
      <Box sx={{ mt: 'auto' }}>
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            display: 'flex',
            gap: 1,
            mb: 2
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={isTyping ? "Waiting for response..." : "Type your message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isTyping}
          />
          <IconButton 
            type="submit" 
            color="primary"
            disabled={isTyping || !newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleNewChat} 
            fullWidth
            disabled={isTyping}
          >
            New Chat
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClearChat} 
            fullWidth
            disabled={isTyping}
          >
            Clear Chat
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat; 