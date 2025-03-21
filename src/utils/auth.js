/**
 * @fileoverview Authentication utility functions for managing user tokens and data.
 * Provides functions for storing and retrieving authentication state in localStorage.
 */

/**
 * Key used to store the authentication token in localStorage.
 * @constant {string}
 */
const TOKEN_KEY = 'wisdomai_token';

/**
 * Key used to store the user data in localStorage.
 * @constant {string}
 */
const USER_KEY = 'wisdomai_user';

/**
 * Stores or removes the authentication token in localStorage.
 * 
 * @function setAuthToken
 * @param {string|null} token - The JWT token to store, or null to remove
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Retrieves the authentication token from localStorage.
 * 
 * @function getAuthToken
 * @returns {string|null} The stored JWT token, or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Stores or removes the user data in localStorage.
 * 
 * @function setUser
 * @param {Object|null} user - The user object to store, or null to remove
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Retrieves the user data from localStorage.
 * 
 * @function getUser
 * @returns {Object|null} The stored user object, or null if not found
 */
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Checks if a user is currently authenticated.
 * 
 * @function isAuthenticated
 * @returns {boolean} True if a valid token exists, false otherwise
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Logs out the current user by removing all authentication data.
 * 
 * @function logout
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}; 