import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import "./index.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch("https://chatddk-backend.vercel.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
          content: "Error: Unable to fetch response from ChatDDK backend.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await fetch("https://chatddk-backend.vercel.app/reset", {
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
    <Box sx={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <Typography variant="h3" gutterBottom>
        ChatDDK
      </Typography>

      {/* Chat Container with Ref */}
      <Paper
        elevation={3}
        className="chat-container"
        ref={chatContainerRef} // Attach ref here
      >
        {chatHistory.map((entry, index) => (
          <Box
            key={index}
            className={
              entry.role === "user" ? "user-message" : "assistant-message"
            }
          >
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </Box>
        ))}
        {isLoading && (
          <div className="loading-indicator">
            <CircularProgress size={24} />
            <Typography variant="body2">Thinking...</Typography>
          </div>
        )}
      </Paper>

      {/* Input Area */}
      <Box sx={{ display: "flex", marginTop: "10px" }}>
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
          sx={{ ml: 2, padding: "10px 20px" }}
        >
          Send
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleClearChat}
          sx={{ marginLeft: "10px" }}
        >
          Clear Chat
        </Button>
      </Box>
    </Box>
  );
}

export default App;
