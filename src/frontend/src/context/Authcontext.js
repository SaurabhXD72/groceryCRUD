// Create file: frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (localStorage.getItem('token')) {
        const token = localStorage.getItem('token');

        // Set default headers for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          const res = await axios.get('http://localhost:5000/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Auth check error:', err);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/register',
        formData,
      );
      localStorage.setItem('token', res.data.token);

      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${res.data.token}`;

      setUser(res.data.user);
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData,
      );
      localStorage.setItem('token', res.data.token);

      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${res.data.token}`;

      setUser(res.data.user);
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
