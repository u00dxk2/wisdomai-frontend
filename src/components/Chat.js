import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Box, TextField, Button, Typography, Paper, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WisdomSelector from './WisdomSelector';
import UserMemoryDisplay from './UserMemoryDisplay';
import ConversationStarters from './ConversationStarters';
import { getChatMessages, sendMessage, clearChat, saveMessage, updateMemory } from '../services/chatService';
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
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef(null);
  const cleanupRef = useRef(null);
  const streamingMessageRef = useRef('');
  const streamingSourceRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textFieldRef = useRef(null);
  const streamingUpdateTimeoutRef = useRef(null);
  
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const loadChatMessages = useCallback(async () => {
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
  }, [selectedChatId]);

  useEffect(() => {
    loadChatMessages();
  }, [selectedChatId, loadChatMessages]); 

  // This is an important fix: when chat ID appears in the response,
  // update our local selectedChatId to match it
  useEffect(() => {
    if (selectedChatId === null && messages.length > 0) {
      console.log('We have messages but no selectedChatId - something might be wrong');
    }
  }, [selectedChatId, messages]);

  // Scroll to bottom when messages or streaming text change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // Cleanup function for when component unmounts or when starting a new chat
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (streamingUpdateTimeoutRef.current) {
        clearTimeout(streamingUpdateTimeoutRef.current);
        streamingUpdateTimeoutRef.current = null;
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
    
    // Store refs in local variables to avoid closure issues
    const sourceRef = streamingSourceRef.current;
    const abortRef = abortControllerRef.current;
    const timeoutRef = streamingUpdateTimeoutRef.current;
    
    return () => {
      // Cleanup streaming when component unmounts or chatId changes
      if (sourceRef) {
        sourceRef.close();
      }
      if (abortRef) {
        abortRef.abort();
      }
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, [selectedChatId, loadChatMessages]);

  // Only update streaming text if the length has changed significantly to reduce renders
  const updateStreamingText = useCallback((text) => {
    if (streamingUpdateTimeoutRef.current) {
      clearTimeout(streamingUpdateTimeoutRef.current);
    }
    
    streamingUpdateTimeoutRef.current = setTimeout(() => {
      setStreamingText(text);
      streamingUpdateTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
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
    streamingMessageRef.current = '';

    let currentChatId = selectedChatId; // Use existing chatId or null for new chat

    try {
      console.log('Attempting to stream chat with chatId:', currentChatId, 'and figure:', selectedFigure);

      // --- Refactored stream handling ---
      // 1. Call sendMessage to save user message and get setup function
      const { chatId: updatedChatId, setupStream } = await sendMessage(currentChatId, userMessage, selectedFigure);
      
      // Update currentChatId if it was newly created
      if (!currentChatId && updatedChatId) {
        currentChatId = updatedChatId;
      }

      // 2. Define handlers for stream events
      const handleStreamChunk = (chunk, fullReply) => {
        streamingMessageRef.current = fullReply;
        updateStreamingText(fullReply);
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
          
          // Update user memory with the conversation - this ensures facts and preferences are extracted
          updateMemory(userMessage.content, fullReply, selectedFigure)
            .then(() => console.log('Memory updated successfully'))
            .catch(err => console.error('Error updating memory:', err));
          
          // Create a combined state update to minimize flashing
          // We'll directly transition to the final state without intermediary renders
          startTransition(() => {
            // Update both states in the same render cycle
            setMessages(savedChatWithAssistantMsg.messages || []);
            
            // Clear streaming text immediately to avoid duplicate content
            streamingMessageRef.current = '';
            setStreamingText('');
            setIsTyping(false);
            
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Paper
          sx={{
            p: 2,
            maxWidth: '75%',
            backgroundColor: message.role === 'user' ? '#e3f2fd' : '#ffffff',
            borderRadius: message.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
          }}
          elevation={1}
        >
          <Typography variant="body1">{message.content}</Typography>
          {message.role === 'assistant' && message.figure && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
              - {message.figure}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    if (prevProps.message._id !== nextProps.message._id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    return true;
  });

  // Streaming message component (only renders when streaming)
  const StreamingMessage = React.memo(({ text, figure }) => {
    if (!text) return null;
    
    return (
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
          elevation={1}
        >
          <Typography variant="body1">{text}</Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
            - {figure}
          </Typography>
        </Paper>
      </Box>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if the text changes by more than 10 characters
    // This prevents rapid re-renders during streaming
    if (Math.abs(prevProps.text.length - nextProps.text.length) > 10) return false;
    return true;
  });

  // Handle when a conversation starter is selected
  const handleStarterSelect = (starter) => {
    if (isTyping) return;
    
    // Set the message text
    setNewMessage(starter);
    
    // Auto-submit after a short delay to allow the UI to update
    setTimeout(() => {
      const syntheticEvent = { preventDefault: () => {} };
      handleSendMessage(syntheticEvent);
    }, 100);
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
          position: 'relative',
          scrollBehavior: 'smooth'
        }}
      >
        {/* If no messages and not typing, show conversation starters more prominently */}
        {messages.length === 0 && !isTyping && selectedFigure && (
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              mb: 2,
              mt: 4
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              Start a conversation with {selectedFigure}
            </Typography>
            <ConversationStarters
              selectedFigure={selectedFigure}
              onSelectStarter={handleStarterSelect}
              disabled={isTyping}
            />
          </Box>
        )}
      
        {/* Render existing messages with key that includes content to reduce re-renders */}
        {messages.map((msg, index) => (
          <MessageComponent 
            key={msg._id || msg._tempId || `message-${index}`} 
            message={msg} 
          />
        ))}
        
        {/* Render streaming message if any */}
        {streamingText && (
          <StreamingMessage 
            text={streamingText} 
            figure={selectedFigure}
          />
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
              elevation={1}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={14} sx={{ mr: 1.5 }} />
                <Typography variant="body2">Thinking...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Scrolling anchor */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Show conversation starters below messages when there are already messages */}
      {selectedFigure && !isTyping && messages.length > 0 && (
        <ConversationStarters
          selectedFigure={selectedFigure}
          onSelectStarter={handleStarterSelect}
          disabled={isTyping}
        />
      )}

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
                handleSendMessage(e);
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

export default React.memo(Chat); 