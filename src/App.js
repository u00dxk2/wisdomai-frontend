/**
 * @fileoverview Main application component for WisdomAI.
 * Handles user authentication and chat interface.
 */

import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { Box, CssBaseline, Typography, Button, Container } from "@mui/material";
import "./index.css";
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import { isAuthenticated, logout } from './utils/auth';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

/**
 * Main application component that handles user authentication and chat interface.
 * 
 * @component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [selectedFigure, setFigure] = useState('Buddha');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const navigate = useNavigate();

  // When a chat is updated (new message added)
  const handleChatUpdated = (chatId) => {
    console.log('Chat updated with ID:', chatId, 'Current activeChatId:', activeChatId, 'Current selectedChatId:', selectedChatId);
    
    // If chatId is null, this is a "new chat" or "clear chat" action
    if (!chatId) {
      console.log('No chatId provided - creating new chat or clearing current chat');
      
      // Important: Clear both selectedChatId and activeChatId
      // This ensures next message will create a new chat
      setSelectedChatId(null);
      setActiveChatId(null);
      
      // Trigger a refresh to update chat history
      setRefreshTrigger(prev => prev + 1);
      return;
    }
    
    // Always update selectedChatId to the current chat
    // This ensures we stay in the same chat after sending a message
    if (selectedChatId !== chatId) {
      console.log('Updating selectedChatId to:', chatId);
      setSelectedChatId(chatId);
    }
    
    // Always update activeChatId
    if (activeChatId !== chatId) {
      console.log('Updating activeChatId to:', chatId);
      setActiveChatId(chatId);
    }
    
    // Always trigger a refresh to update chat history
    // This ensures new/updated chats appear immediately
    console.log('Triggering history refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  // When a chat is selected from history
  const handleChatSelected = (chatId) => {
    setSelectedChatId(chatId);
    setActiveChatId(chatId);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setSelectedChatId(null);
    setActiveChatId(null);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
  };

  // Wrap the entire app in ThemeProvider
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoggedIn ? (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h4" component="h1">
              Wisdom Triangle
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleLogout}>
              Logout
            </Button>
          </Box>

          {/* Main content */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
              <ChatHistory 
                refreshTrigger={refreshTrigger} 
                onSelectChat={handleChatSelected}
                selectedChatId={selectedChatId}
                activeChatId={activeChatId}
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Chat 
                selectedFigure={selectedFigure} 
                setFigure={setFigure}
                onChatUpdated={handleChatUpdated}
                selectedChatId={selectedChatId}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Routes>
            <Route 
              path="/login" 
              element={
                <Login 
                  onLoginSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => navigate('/register')}
                />
              } 
            />
            <Route 
              path="/register" 
              element={
                <Register
                  onRegisterSuccess={handleRegisterSuccess}
                  onSwitchToLogin={() => navigate('/login')}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Container>
      )}
    </ThemeProvider>
  );
};

export default App;