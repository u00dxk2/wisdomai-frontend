/**
 * @fileoverview Main application component for WisdomAI.
 * Handles user authentication, chat interface, and wisdom figure selection.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./index.css";
import WisdomSelector from './WisdomSelector';
import Login from './components/Login';
import Register from './components/Register';
import { getAuthToken, isAuthenticated, logout } from './utils/auth';

/**
 * Base URL for API requests.
 * Changes based on environment (development/production).
 * @constant {string}
 */
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001'
  : 'https://wisdomai-backend.onrender.com';

/**
 * Main application component that handles the chat interface and user authentication.
 * Provides functionality for:
 * - User authentication (login/register)
 * - Chat message sending and receiving
 * - Wisdom figure selection
 * - Chat history management
 * 
 * @component
 * @returns {JSX.Element} The rendered App component
 */
function App() {
  // Chat state
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [figure, setFigure] = useState('Buddha');
  const [infoOpen, setInfoOpen] = useState(false);

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Refs
  const chatContainerRef = useRef(null);

  /**
   * Scrolls chat container to bottom when new messages are added.
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  /**
   * Handles user logout by clearing authentication state and chat history.
   */
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setChatHistory([]);
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

  /**
   * Toggles between login and registration views.
   */
  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  /**
   * Handles sending a new message to the chat.
   * Creates an EventSource connection for streaming responses.
   * 
   * @async
   * @function handleSendMessage
   * 
   * @throws {Error} When EventSource connection fails
   * @throws {Error} When authentication fails
   */
  const handleSendMessage = async () => {
    if (!message.trim() || !isLoggedIn) return;
  
    setChatHistory((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);
  
    const currentFigure = figure;
    
    // Create EventSource URL with authentication token
    const eventSourceUrl = new URL(`${API_BASE_URL}/chat-stream`);
    eventSourceUrl.searchParams.append('message', message);
    eventSourceUrl.searchParams.append('wisdomFigure', currentFigure);
    eventSourceUrl.searchParams.append('token', getAuthToken());
    
    const eventSource = new EventSource(eventSourceUrl);
  
    let assistantMessage = '';
  
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
  
      if (data.content) {
        assistantMessage += data.content;
        setChatHistory((prev) => {
          const historyWithoutLastAssistantMessage = prev.filter(entry => entry.role !== "assistant" || entry !== prev[prev.length - 1]);
          return [...historyWithoutLastAssistantMessage, { role: "assistant", content: assistantMessage, figure: currentFigure }];
        });
      }
  
      if (data.done) {
        eventSource.close();
        setIsLoading(false);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      setIsLoading(false);
      eventSource.close();
      
      // Handle authentication errors
      if (error.status === 401) {
        setIsLoggedIn(false);
        logout();
      }
    };
  
    setMessage('');
  };  

  /**
   * Handles clearing the chat history.
   * Makes API request to reset conversation on the server.
   * 
   * @async
   * @function handleClearChat
   * 
   * @throws {Error} When reset request fails
   */
  const handleClearChat = async () => {
    if (!isLoggedIn) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        setChatHistory([]);
        console.log("Conversation reset successfully.");
      } else if (response.status === 401) {
        setIsLoggedIn(false);
        logout();
      } else {
        console.error("Failed to reset conversation.");
      }
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        alignItems: "center",
        py: 4,
        px: 2,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Box sx={{ width: "90%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h3">
          WisdomAI
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
  
      <Paper
        elevation={3}
        sx={{
          width: "90%",
          maxWidth: "800px",
          p: 2,
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box
          ref={chatContainerRef}
          sx={{
            flex: "1 1 auto",
            overflowY: "auto",
            mb: 2,
            p: 2,
            backgroundColor: "#fff",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {chatHistory.map((entry, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: entry.role === "user" ? "#ddeeff" : "#f1f1f1",
                color: "#333",
                p: 2,
                m: 1,
                borderRadius: 2,
                maxWidth: "75%",
                alignSelf: entry.role === "user" ? "flex-end" : "flex-start",
                textAlign: "left",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                {entry.role === "user" ? "You" : entry.figure || "WisdomAI"}
              </Typography>
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </Box>
          ))}
  
          {isLoading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Contemplating...
              </Typography>
            </Box>
          )}
        </Box>
  
        {/* Wisdom Selector */}
        <WisdomSelector figure={figure} setFigure={setFigure} />
  
        {/* Input and Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
          <TextField
            multiline
            minRows={1}
            maxRows={4}
            variant="outlined"
            placeholder="Enter your query..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
  
          {/* Buttons below text input */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              Send
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearChat}
              disabled={isLoading}
            >
              Clear Chat
            </Button>
          </Box>
        </Box>
      </Paper>
  
      {/* About WisdomAI Section */}
      <Box sx={{ width: "90%", maxWidth: "800px", mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#e0e6ef",
            p: 1.5,
            borderRadius: 2,
            cursor: "pointer",
          }}
          onClick={() => setInfoOpen(!infoOpen)}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#4a6fa5" }}>
            About WisdomAI
          </Typography>
  
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setInfoOpen(!infoOpen);
            }}
            sx={{
              transform: infoOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
  
        <Collapse in={infoOpen}>
          <Box sx={{ p: 2, backgroundColor: "#f7f9fc", borderRadius: 2, mt: 1 }}>
            <Typography variant="body2">
              <strong>WisdomAI</strong> is your philosophical companion designed to bring timeless wisdom into your daily life.
              <br /><br />
              Select a wisdom figure—like Buddha, Epictetus, Jesus, Laozi, Kurt Vonnegut, Carl Sagan, David Kooi (lol),Mark Twain, or Rumi—and explore thoughtful responses to your questions.
              <br /><br />
              WisdomAI uses the OpenAI GPT-4o model enhanced by carefully curated texts reflecting each wisdom figure's authentic teachings.
              <br /><br />
              Use WisdomAI to gain clarity, inspire reflection, and explore life's deeper truths from diverse philosophical perspectives.
              <br /><br />
              <em>Note: WisdomAI is powered by artificial intelligence and intended to offer reflective guidance, not definitive advice.</em>
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default App;