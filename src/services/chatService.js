import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const API_VERSION = '/api/v1';

/**
 * Send a message to the wisdom figure and handle streaming response
 * @param {string} chatId - Optional chat ID for existing chat
 * @param {Object} message - Message object with role and content
 * @param {string} wisdomFigure - The selected wisdom figure
 * @returns {Promise} Object with streaming response handlers
 */
export const sendMessage = async (chatId, message, wisdomFigure) => {
  try {
    // First save the user message
    const chatResponse = await saveMessage(chatId, message, wisdomFigure);
    
    // Create EventSource URL with parameters
    const url = `${API_URL}${API_VERSION}/chat/stream`;
    const params = new URLSearchParams({
      message: message.content,
      wisdomFigure: wisdomFigure,
      token: getAuthToken()
    });
    
    // This will set up the streaming connection
    const setupStream = (onChunk, onDone, onError) => {
      // Create the EventSource for streaming
      const eventSource = new EventSource(`${url}?${params}`);
      let fullResponse = '';
      
      // Handle incoming chunks
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // If we have content, add it to the response
          if (data.content !== undefined) {
            fullResponse += data.content;
            onChunk(data.content, fullResponse);
          }
          
          // If we're done, close the connection and save the message
          if (data.done) {
            eventSource.close();
            
            // Save the complete message
            saveMessage(chatResponse._id, {
              role: 'assistant',
              content: fullResponse,
              figure: wisdomFigure
            }, wisdomFigure)
            .then(() => onDone(fullResponse))
            .catch(error => {
              console.error('Error saving assistant message:', error);
              onDone(fullResponse);
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          onError(error);
          eventSource.close();
        }
      };
      
      // Handle errors
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        onError(error);
        eventSource.close();
      };
      
      // Return cleanup function
      return () => {
        eventSource.close();
      };
    };
    
    return {
      chatId: chatResponse._id,
      setupStream
    };
  } catch (error) {
    console.error('Error setting up streaming:', error);
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
 * @returns {Promise} Success response
 */
export const clearChat = async () => {
  try {
    const response = await axios.post(`${API_URL}${API_VERSION}/chat/clear`, {}, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error clearing chat:', error.response?.data || error.message);
    throw error;
  }
}; 