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
  const [figure, setFigure] = useState('Buddha');

  const [infoOpen, setInfoOpen] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const currentFigure = figure;

    setChatHistory((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch("https://wisdomai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, wisdomFigure: currentFigure }),
      });

      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, figure: currentFigure },
      ]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Unable to fetch response from backend.",
          figure: currentFigure,
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
        backgroundColor: "#fafafa",
        alignItems: "center",
        py: 4,
        px: 2,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Typography variant="h3" gutterBottom>
        WisdomAI
      </Typography>
  
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
              color="primary"
              onClick={handleSendMessage}
              sx={{ px: 2, py: 1 }}
            >
              Send
            </Button>
  
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearChat}
              sx={{ px: 2, py: 1 }}
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
              WisdomAI uses the OpenAI GPT-4o model enhanced by carefully curated texts reflecting each wisdom figure’s authentic teachings.
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