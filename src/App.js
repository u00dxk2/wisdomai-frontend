/**
 * @fileoverview Main application component for WisdomAI.
 * Handles user authentication and chat interface.
 */

import React, { useState } from "react";
import { Box } from "@mui/material";
import "./index.css";
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import { isAuthenticated } from './utils/auth';

/**
 * Main application component that handles user authentication and chat interface.
 * 
 * @component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  // State
  const [isLoggedIn] = useState(isAuthenticated());
  const [selectedFigure, setFigure] = useState('Buddha');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleChatUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChatSelected = (chatId) => {
    setSelectedChatId(chatId);
  };

  // Render login/register forms if not authenticated
  if (!isLoggedIn) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ width: 400, p: 3 }}>
          <h1>Please log in to continue</h1>
        </Box>
      </Box>
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