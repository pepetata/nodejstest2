import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { storage } from '../../store/authSlice';
import authService from '../../services/authService';
import PropTypes from 'prop-types';

const AdminProtectedRoute = ({ children }) => {
  const { restaurantSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRehydrating, setIsRehydrating] = useState(true);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => !!state.auth.user);
  const user = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);

  console.log('AdminProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('AdminProtectedRoute - user:', user);
  console.log('AdminProtectedRoute - restaurantSlug:', restaurantSlug);
  console.log('AdminProtectedRoute - authStatus:', authStatus);

  // Check if we're on a subdomain (no restaurantSlug in URL params)
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  console.log('AdminProtectedRoute - isSubdomain:', isSubdomain);

  // Handle initial rehydration state - simple timeout approach
  useEffect(() => {
    const hasToken = storage.get('token');
    console.log('AdminProtectedRoute - Initial rehydration check:', {
      hasToken: !!hasToken,
      isAuthenticated,
    });

    if (!hasToken) {
      // No token, no need to wait for rehydration
      console.log('AdminProtectedRoute - No token, stopping rehydration immediately');
      setIsRehydrating(false);
    } else {
      // We have a token, give rehydration some time to complete
      console.log('AdminProtectedRoute - Token found, waiting for rehydration...');
      const timeoutId = setTimeout(() => {
        console.log('AdminProtectedRoute - Rehydration timeout completed');
        setIsRehydrating(false);
      }, 1000); // Wait 1 second for rehydration

      // If user gets authenticated before timeout, stop waiting immediately
      if (isAuthenticated) {
        console.log('AdminProtectedRoute - User authenticated during wait, stopping rehydration');
        clearTimeout(timeoutId);
        setIsRehydrating(false);
      }

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated]); // Only depend on isAuthenticated to avoid loops

  // Handle cross-domain authentication
  useEffect(() => {
    const token = searchParams.get('token');
    const auth = searchParams.get('auth');

    if (token && auth === 'true' && !isAuthenticated) {
      console.log('AdminProtectedRoute - Found token in URL, setting up authentication');

      // Store the token in localStorage for this subdomain
      storage.set('token', token, true); // Use localStorage (rememberMe = true)

      // Get user data using the token
      authService
        .getCurrentUser()
        .then((response) => {
          console.log('AdminProtectedRoute - API Response:', response); // Debug full response
          const userData = response.data?.user || response.user; // Handle different response structures
          console.log('AdminProtectedRoute - Successfully fetched user data:', userData);
          dispatch(setUser(userData));

          // Clean up URL parameters after a small delay to prevent flickering
          setTimeout(() => {
            searchParams.delete('token');
            searchParams.delete('auth');
            setSearchParams(searchParams, { replace: true });
          }, 100);
        })
        .catch((error) => {
          console.error('AdminProtectedRoute - Failed to fetch user data:', error);
          // Clean up URL parameters even on error
          searchParams.delete('token');
          searchParams.delete('auth');
          setSearchParams(searchParams, { replace: true });
        });
    }
  }, [searchParams, setSearchParams, dispatch, isAuthenticated]);

  // If we're currently processing authentication from URL params, show loading
  const token = searchParams.get('token');
  const auth = searchParams.get('auth');
  if (token && auth === 'true' && !isAuthenticated) {
    console.log('AdminProtectedRoute - Processing authentication...');
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        Carregando painel administrativo...
      </div>
    ); // Better loading state
  }

  // Show loading state while rehydrating authentication
  if (isRehydrating) {
    console.log('AdminProtectedRoute - Rehydrating authentication state...');
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        Carregando painel administrativo...
      </div>
    );
  }

  // Check if user is authenticated - both Redux state and localStorage token
  const hasValidToken = storage.get('token');
  const isUserAuthenticated = isAuthenticated && hasValidToken;

  if (!isUserAuthenticated) {
    console.log(
      'AdminProtectedRoute - User not authenticated or no valid token, redirecting to login'
    );

    // Clear any stale Redux state if token is missing
    if (isAuthenticated && !hasValidToken) {
      console.log('AdminProtectedRoute - Clearing stale authentication state');
      dispatch({ type: 'auth/logout' });
    }

    if (isSubdomain) {
      // On subdomain, redirect to main app login page
      const mainAppUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
      window.location.href = `${mainAppUrl}/login`;
      return null;
    } else {
      // On main app, redirect to /:restaurantSlug/login
      return <Navigate to={`/${restaurantSlug}/login`} replace />;
    }
  }

  // Check if user has admin permissions
  // For now, we'll allow any authenticated user to access admin
  // In a real app, you'd check specific roles like 'admin', 'restaurant_admin', etc.
  const hasAdminAccess =
    user &&
    (user.role === 'admin' ||
      user.role === 'restaurant_admin' ||
      user.role === 'restaurant_administrator' || // Added this role
      user.role === 'manager' ||
      user.role === 'staff'); // For now, allow staff to test the interface

  console.log('AdminProtectedRoute - hasAdminAccess:', hasAdminAccess);
  console.log('AdminProtectedRoute - user.role:', user?.role);

  if (!hasAdminAccess) {
    console.log('AdminProtectedRoute - User lacks admin access, redirecting');
    if (isSubdomain) {
      // On subdomain, redirect to home page
      return <Navigate to="/" replace />;
    } else {
      // On main app, redirect to restaurant home page
      return <Navigate to={`/${restaurantSlug}`} replace />;
    }
  }

  console.log('AdminProtectedRoute - All checks passed, rendering children');
  return children;
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminProtectedRoute;
