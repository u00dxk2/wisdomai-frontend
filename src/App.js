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

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [figure, setFigure] = useState('Buddha'); // default selection

  // Collapsible info section state
  const [infoOpen, setInfoOpen] = useState(false);

  // Ref for the chat container
  const chatContainerRef = useRef(null);

  // Scroll to bottom when chatHistory updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setChatHistory((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch("https://wisdomai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, wisdomFigure: figure }),
      });

      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Unable to fetch response from backend.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await fetch("https://wisdomai-backend.onrender.com/reset", {
        method: "POST",
      });

      if (response.ok) {
        setChatHistory([]);
        console.log("Conversation reset successfully.");
      } else {
        console.error("Failed to reset conversation.");
      }
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#fafafa", // Light background
        alignItems: "center",
        py: 4,
        px: 2,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Title */}
      <Typography variant="h3" gutterBottom>
        WisdomAI
      </Typography>

      {/* Main Chat Container */}
      <Paper
        elevation={3}
        sx={{
          width: "90%",
          maxWidth: "800px", // limit the width on large screens
          p: 2,
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Messages Area */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: "1 1 auto",
            overflowY: "auto",
            mb: 2,
            p: 2,
            backgroundColor: "#fff",
            borderRadius: 2,
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
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
      {entry.role === "user" ? "You" : figure}
    </Typography>
    <ReactMarkdown>{entry.content}</ReactMarkdown>
  </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Thinking...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <WisdomSelector figure={figure} setFigure={setFigure} />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            sx={{ ml: 2 }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearChat}
            sx={{ ml: 1 }}
          >
            Clear Chat
          </Button>
        </Box>
      </Paper>

      {/* Collapsible "Information" Section */}
      <Box
        sx={{
          width: "90%",
          maxWidth: "800px",
          mt: 2,
        }}
      >
        {/* Header row with "Information" label */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f0f0f0",
            p: 1,
            borderRadius: 2,
            cursor: "pointer",
          }}
          onClick={() => setInfoOpen(!infoOpen)}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Information
          </Typography>

          {/* Icon to show expand/collapse */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent double toggle if you click the icon
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
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f8f8f8",
              borderRadius: 2,
              mt: 1,
            }}
          >
            <Typography variant="body2">
              ChatDDK is the virtual version of David Kooi, CEO and Co-Founder of Jointly.
              <br />
              <br />
              He is made from OpenAI&apos;s ChatGPT 4o model 
              and trained with over 100 documents the real David Kooi has written          
              about Jointly, Jointly's software, and Purposeful Consumption since 2018.
              <br />
              <br />
              ChatDDK knows about Jointly&apos;s software:
              <br />
              *Why we made it
              <br />
              *Whom we made it for
              <br />
              *How we made it
              <br />
              <br />
              And the problems we aim to solve for:
              <br />
              *Cannabis consumers
              <br />
              *Cannabis retailers
              <br />
              *The cannabis industry
              <br />
              <br />
              ChatDDK does not have any confidential information.
              If he gives you any, it is a hallucination.
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default App;
