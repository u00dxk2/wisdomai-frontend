import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Save a message to chat history
 * @param {string} chatId - Optional chat ID for existing chat
 * @param {Object} message - Message object with role and content
 * @param {string} wisdomFigure - The selected wisdom figure
 * @returns {Promise} Chat object with messages
 */
export const saveMessage = async (chatId, message, wisdomFigure) => {
  try {
    console.log('Saving message:', { chatId, message, wisdomFigure });
    const response = await axios.post(`${API_URL}/api/chat/message`, {
      chatId,
      message,
      wisdomFigure
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
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
    const response = await axios.get(`${API_URL}/api/chat/history`, {
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
 * @param {string} chatId - Chat ID
 * @returns {Promise} Chat object with messages
 */
export const getChatMessages = async (chatId) => {
  try {
    const response = await axios.get(`${API_URL}/api/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat messages:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise} Success message
 */
export const deleteChat = async (chatId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/chat/${chatId}`, {
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