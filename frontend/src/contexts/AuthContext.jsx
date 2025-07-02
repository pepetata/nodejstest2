import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth state
    setLoading(false);
  }, []);

  const login = async (email, _password) => {
    setError(null);
    try {
      // Mock login for now - replace with actual API call
      const mockUser = { id: 1, email, name: 'Test User' };
      const mockToken = 'mock-token-' + Date.now();

      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      // Mock registration for now - replace with actual API call
      const mockUser = {
        id: Date.now(),
        email: userData.email,
        name: userData.ownerName || userData.name,
        type: userData.type || 'user',
      };
      const mockToken = 'mock-token-' + Date.now();

      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('token');
    } catch {
      // Handle localStorage errors gracefully
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AuthContext, AuthProvider };
