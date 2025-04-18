import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Box, TextField, Button, Typography, Paper, IconButton, Fade, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import WisdomSelector from './WisdomSelector';
import UserMemoryDisplay from './UserMemoryDisplay';
import { getChatMessages, sendMessage, clearChat, saveMessage } from '../services/chatService';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const Chat = ({ selectedFigure, setFigure, onChatUpdated, selectedChatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef(null);
  const cleanupRef = useRef(null);
  const streamingMessageRef = useRef('');
  const streamingSourceRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textFieldRef = useRef(null);
  
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

  // Focus the input field when the component loads
  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, []);
  
  // Update the ref when the chatId changes
  useEffect(() => {
    currentChatIdRef.current = selectedChatId;
    
    // Initialize or clear for a new chat
    if (!selectedChatId) {
      // Reset state for new chat
      setMessages([]);
      setStreamingText('');
      streamingMessageRef.current = '';
      if (textFieldRef.current) {
        textFieldRef.current.focus();
      }
    } else {
      // Load messages for existing chat
      loadChatMessages();
    }
    
    return () => {
      // Cleanup streaming when component unmounts or chatId changes
      if (streamingSourceRef.current) {
        streamingSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedChatId]);

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
        streamingMessageRef.current += chunk;
        setStreamingText(fullReply); // Update streaming text display
      };

      const handleStreamDone = async (fullReply) => {
        console.log('Stream finished.');
        cleanupRef.current = null; // Clear cleanup ref

        const assistantMessage = {
          role: 'assistant',
          content: fullReply,
          figure: selectedFigure
        };

        try {
          // Save the assistant message to the same chat
          const savedChatWithAssistantMsg = await saveMessage(currentChatId, assistantMessage);
          
          // Use React transitions for smoother UI update
          startTransition(() => {
            // First update the messages array without clearing the streaming text
            setMessages(savedChatWithAssistantMsg.messages || []); 
            
            // Only after the DOM has updated, clear the typing state with a delay
            // This prevents the jarring transition between streaming and final message
            setTimeout(() => {
              setIsTyping(false);
              // Keep streaming text visible momentarily to prevent flashing
              setTimeout(() => {
                setStreamingText('');
              }, 50);
            }, 150);
            
            // Notify parent of the final chat ID and that update is complete
            onChatUpdated(currentChatId);
          });

        } catch (saveError) {
          console.error("Error saving assistant message:", saveError);
          setMessages(prevMessages => [...prevMessages, { role: 'system', content: 'Error: Failed to save assistant response.' }]);
          setIsTyping(false);
          setStreamingText('');
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

  // Component for rendering a message
  const MessageComponent = React.memo(({ message }) => {
    return (
      <Fade 
        in={true} 
        key={`${message._id || message._tempId || message.role}-${message.content.substring(0, 10)}`}
        timeout={300}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            mb: 2,
            transition: 'opacity 0.3s ease, transform 0.2s ease',
          }}
        >
          <Paper
            sx={{
              p: 2,
              maxWidth: '75%',
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#ffffff',
              borderRadius: message.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
            {message.role === 'assistant' && message.figure && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
                - {message.figure}
              </Typography>
            )}
          </Paper>
        </Box>
      </Fade>
    );
  });

  // Streaming message component (only renders when streaming)
  const StreamingMessage = React.memo(({ text }) => {
    if (!text) return null;
    
    return (
      <Fade in={true} timeout={200}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            mb: 2,
            transition: 'opacity 0.3s ease',
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
            <Typography variant="body1">{text}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
              - {selectedFigure}
            </Typography>
          </Paper>
        </Box>
      </Fade>
    );
  });

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
        {/* Render existing messages with key that includes content to reduce re-renders */}
        {messages.map((msg, index) => (
          <MessageComponent key={msg._id || msg._tempId || index} message={msg} />
        ))}
        
        {/* Render streaming message if any */}
        {streamingText && (
          <StreamingMessage text={streamingText} />
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
            inputRef={textFieldRef}
            autoFocus
            multiline
            maxRows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
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