import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    // Optionally, fetch user info if token exists
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      // Route based on user type
      if (data.user.type === 'admin' || data.user.type === 'restaurant-admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/fake-user', { replace: true });
      }
      return true;
    } catch (err) {
      // Show error in Portuguese
      let msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Login falhou';
      if (msg === 'Invalid credentials' || err.response?.status === 500) {
        msg = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      }
      setError(msg);
      return false;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      // You can implement registration with backend here
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
