import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const API_VERSION = '/api/v1';

/**
 * Updates user memory with conversation data
 * This ensures the backend extracts facts and preferences from the conversation
 * @param {string} userMessage - The user's message
 * @param {string} aiResponse - The AI's response
 * @param {string} wisdomFigure - The wisdom figure used
 * @returns {Promise} Success response
 */
export const updateMemory = async (userMessage, aiResponse, wisdomFigure) => {
  try {
    console.log('Updating user memory with conversation');
    const response = await axios.post(`${API_URL}${API_VERSION}/chat/update-memory`, {
      userMessage,
      aiResponse,
      wisdomFigure
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user memory:', error.response?.data || error.message);
    // Don't throw the error - this is non-critical functionality
    return { success: false };
  }
};

/**
 * Sets up an EventSource connection to stream chat responses.
 * @param {string | null} chatId - Optional ID of the current chat thread.
 * @param {object} message - The user message object.
 * @param {string} wisdomFigure - Selected wisdom figure to respond.
 * @returns {Promise<object>} - Object containing the chat ID and setup function.
 */
export const sendMessage = async (chatId, message, wisdomFigure) => {
  try {
    console.log('Attempting to stream chat with chatId:', chatId, 'and figure:', wisdomFigure);
    
    // First save the user message to get a chatId if we don't have one
    const userMessageObj = {
      role: 'user',
      content: message.content || message,
    };
    
    const savedChat = await saveMessage(chatId, userMessageObj, wisdomFigure);
    const updatedChatId = savedChat._id;
    
    console.log('Created/Updated chat with ID:', updatedChatId);
    
    // Function to set up streaming, to be called by the component
    const setupStream = (handleChunk, handleDone, handleError) => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const token = getAuthToken();
        
        // IMPORTANT: This is the correct streaming endpoint URL
        const eventSourceUrl = new URL(`${baseUrl}/chat-stream`);
        
        // Add the required query parameters
        eventSourceUrl.searchParams.append('message', userMessageObj.content);
        eventSourceUrl.searchParams.append('wisdomFigure', wisdomFigure);
        eventSourceUrl.searchParams.append('chatId', updatedChatId);
        
        // Add authentication token as query parameter since EventSource doesn't support custom headers
        eventSourceUrl.searchParams.append('token', token);
        
        // Create the EventSource
        console.log(`Creating EventSource with URL: ${eventSourceUrl.toString()}`);
        const eventSource = new EventSource(eventSourceUrl.toString());
        
        let fullResponse = '';
        
        // Handle incoming message chunks
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // If we have content, update the UI
            if (data.content) {
              fullResponse += data.content;
              handleChunk(data.content, fullResponse);
            }
            
            // If we're done, clean up and notify the component
            if (data.done) {
              console.log('Stream complete');
              eventSource.close();
              handleDone(fullResponse);
            }
          } catch (err) {
            console.error('Error handling stream message:', err);
            eventSource.close();
            handleError(err);
          }
        };
        
        // Handle errors
        eventSource.onerror = (err) => {
          console.error('EventSource failed:', err);
          eventSource.close();
          handleError(err);
        };
        
        // Return a cleanup function
        return () => {
          if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
            console.log('Closing EventSource connection');
            eventSource.close();
          }
        };
      } catch (err) {
        console.error('Error setting up streaming:', err);
        handleError(err);
        return () => {}; // Empty cleanup function if setup failed
      }
    };
    
    return { chatId: updatedChatId, setupStream };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Save a message to chat history
 * @param {string} chatId - Optional chat ID for existing chat
 * @param {Object} message - Message object with role and content
 * @param {string} wisdomFigure - The selected wisdom figure
 * @returns {Promise} Chat object with messages
 */
export const saveMessage = async (chatId, message, wisdomFigure) => {
  try {
    if (chatId) {
      console.log('Adding message to existing chat:', chatId);
    } else {
      console.log('Creating a new chat with message:', message);
    }
    
    const response = await axios.post(`${API_URL}${API_VERSION}/chat/message`, {
      chatId,
      message,
      wisdomFigure
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!chatId) {
      console.log('New chat created with ID:', response.data._id);
    } else {
      console.log('Updated chat ID:', response.data._id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error saving message:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user's chat history
 * @returns {Promise} Array of chat objects
 */
export const getChatHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}${API_VERSION}/chat/history`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get messages for a specific chat
 * @param {string} chatId - The chat ID
 * @returns {Promise} Array of messages
 */
export const getChatMessages = async (chatId) => {
  try {
    const response = await axios.get(`${API_URL}${API_VERSION}/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data.messages;
  } catch (error) {
    console.error('Error fetching chat messages:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a chat
 * @param {string} chatId - The chat ID to delete
 * @returns {Promise} Success response
 */
export const deleteChat = async (chatId) => {
  try {
    const response = await axios.delete(`${API_URL}${API_VERSION}/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting chat:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Clear the current chat messages
 * @param {string} chatId - ID of the chat to clear
 * @returns {Promise} Success response
 */
export const clearChat = async (chatId) => {
  if (!chatId) {
    console.error('Cannot clear chat: No chat ID provided');
    throw new Error('Chat ID is required');
  }
  
  try {
    const response = await axios.post(`${API_URL}${API_VERSION}/chat/clear`, 
      { chatId }, 
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error clearing chat:', error.response?.data || error.message);
    throw error;
  }
}; 