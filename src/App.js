/**
 * @fileoverview Main application component for WisdomAI.
 * Handles user authentication and chat interface.
 */

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { Box, CssBaseline, Typography, Button, Container, Grid } from "@mui/material";
import "./index.css";
import WisdomSelector from './components/WisdomSelector';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import { isAuthenticated, logout } from './utils/auth';

/**
 * Main application component that handles user authentication and chat interface.
 * 
 * @component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedFigure, setFigure] = useState('Buddha');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleChatUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChatSelected = (chatId) => {
    setSelectedChatId(chatId);
  };

  /**
   * Handles user logout.
   */
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
  };

  /**
   * Handles successful login by updating authentication state.
   */
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  /**
   * Handles successful registration by updating authentication state.
   */
  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
  };

  // Render authentication components if not logged in
  if (!isLoggedIn) {
    return authMode === 'login' ? (
      <Login 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    ) : (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  // Render main chat interface
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
        <ChatHistory 
          refreshTrigger={refreshTrigger} 
          onSelectChat={handleChatSelected}
          selectedChatId={selectedChatId}
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
  );
};

export default App;