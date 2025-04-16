import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WisdomSelector from './WisdomSelector';
import UserMemoryDisplay from './UserMemoryDisplay';
import { getChatMessages, sendMessage, clearChat, saveMessage } from '../services/chatService';

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

    // Add user message to state immediately for responsiveness
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setStreamingText('');

    let currentChatId = selectedChatId; // Use existing chatId or null for new chat

    try {
      console.log('Attempting to stream chat with chatId:', currentChatId, 'and figure:', selectedFigure);

      // --- Refactored stream handling ---
      // 1. Call sendMessage to save user message and get setup function
      const { chatId: updatedChatId, setupStream } = await sendMessage(currentChatId, userMessage, selectedFigure);
      
      // Update currentChatId if it was newly created
      if (!currentChatId && updatedChatId) {
        currentChatId = updatedChatId;
        // Optionally notify parent immediately if needed, though onChatUpdated is called later too
        // onChatUpdated(currentChatId); 
      }

      // 2. Define handlers for stream events
      const handleStreamChunk = (chunk, fullReply) => {
        setStreamingText(fullReply); // Update streaming text display
      };

      const handleStreamDone = async (fullReply) => {
        console.log('Stream finished.');
        cleanupRef.current = null; // Clear cleanup ref

        setIsTyping(false);
        setStreamingText(''); // Clear intermediate streaming text

        const assistantMessage = {
          role: 'assistant',
          content: fullReply,
          figure: selectedFigure
        };

        try {
          // Save the assistant message to the same chat
          const savedChatWithAssistantMsg = await saveMessage(currentChatId, assistantMessage);
          
          // Update the full message list in the UI state *after* saving
          setMessages(savedChatWithAssistantMsg.messages || []); 
          
          // Notify parent of the final chat ID and that update is complete
          onChatUpdated(currentChatId); 

        } catch (saveError) {
          console.error("Error saving assistant message:", saveError);
          setMessages(prevMessages => [...prevMessages, { role: 'system', content: 'Error: Failed to save assistant response.' }]);
        }
      };

      const handleStreamError = (error) => {
        console.error('EventSource failed:', error);
        setIsTyping(false);
        setStreamingText('');
        setMessages(prevMessages => [...prevMessages, { role: 'system', content: 'Error: Connection to server lost.' }]);
        if (cleanupRef.current) {
           cleanupRef.current();
           cleanupRef.current = null;
        }
      };

      // 3. Call setupStream to start the connection and get the cleanup function
      const cleanup = setupStream(handleStreamChunk, handleStreamDone, handleStreamError);
      
      // Store the cleanup function
      cleanupRef.current = cleanup;

    } catch (error) {
      console.error('Error initiating chat stream:', error);
      setIsTyping(false);
      setMessages(prevMessages => [...prevMessages, { role: 'system', content: 'Error: Could not start chat. Please try again.' }]);
      // Ensure cleanup is called if error happens during setup
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <UserMemoryDisplay />
      
      {/* Chat messages container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Render existing messages */}
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '75%',
                backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
              }}
            >
              <Typography variant="body1">{msg.content}</Typography>
              {msg.role === 'assistant' && msg.figure && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
                  - {msg.figure}
                </Typography>
              )}
            </Paper>
          </Box>
        ))}
        
        {/* Render streaming message if any */}
        {streamingText && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '75%',
                backgroundColor: '#ffffff',
                borderRadius: '15px 15px 15px 0',
              }}
            >
              <Typography variant="body1">{streamingText}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
                - {selectedFigure}
              </Typography>
            </Paper>
          </Box>
        )}
        
        {/* Indicate when the assistant is thinking */}
        {isTyping && !streamingText && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                backgroundColor: '#ffffff',
                borderRadius: '15px 15px 15px 0',
              }}
            >
              <Typography variant="body2">Thinking...</Typography>
            </Paper>
          </Box>
        )}
        
        {/* Scrolling anchor */}
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
            placeholder={isTyping ? "Waiting for response..." : "How can we help you..."}
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