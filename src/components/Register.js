/**
 * @fileoverview Registration component for WisdomAI application.
 * Handles new user account creation with username, email, and password.
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
 * Changes based on environment (development/production).
 * @constant {string}
 */
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001'
  : 'https://wisdomai-backend.onrender.com';

/**
 * Register component that handles new user account creation.
 * Provides a form for username, email, and password input with validation,
 * handles form submission, and manages registration state.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onRegisterSuccess - Callback function called after successful registration
 * @param {Function} props.onSwitchToLogin - Callback function to switch to login view
 * 
 * @example
 * <Register 
 *   onRegisterSuccess={() => console.log('Registered!')}
 *   onSwitchToLogin={() => setView('login')}
 * />
 */
const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles form submission for user registration.
   * Performs client-side validation and makes API request to create new user.
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * 
   * @throws {Error} When registration request fails
   * @throws {Error} When password validation fails
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and user data
      setAuthToken(data.token);
      setUser(data.user);

      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Notify parent component
      onRegisterSuccess();
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
          Create WisdomAI Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
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
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToLogin}
              sx={{ textDecoration: 'none' }}
            >
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register; 