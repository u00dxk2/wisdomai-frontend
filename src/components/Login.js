/**
 * @fileoverview Login component for WisdomAI application.
 * Handles user authentication through email and password.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
} from '@mui/material';
import { setAuthToken, setUser } from '../utils/auth';

/**
 * Base URL for API requests.
 * Uses environment variable for production URL.
 * @constant {string}
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Login component that handles user authentication.
 * Provides a form for email and password input, handles form submission,
 * and manages authentication state.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onLoginSuccess - Callback function called after successful login
 * @param {Function} props.onSwitchToRegister - Callback function to switch to registration view
 * 
 * @example
 * <Login 
 *   onLoginSuccess={() => console.log('Logged in!')}
 *   onSwitchToRegister={() => setView('register')}
 * />
 */
const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles form submission for user login.
   * Makes API request to authenticate user and stores token on success.
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * 
   * @throws {Error} When login request fails
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      setAuthToken(data.token);
      setUser(data.user);

      // Clear form
      setEmail('');
      setPassword('');

      // Notify parent component
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#fafafa',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Login to WisdomAI
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToRegister}
              sx={{ textDecoration: 'none' }}
            >
              Create one here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login; 