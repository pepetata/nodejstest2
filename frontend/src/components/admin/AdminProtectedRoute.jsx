import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { simulateAuth } from '../../store/authSlice';
import { storage } from '../../store/authSlice';
import authService from '../../services/authService';
import InactiveRestaurantModal from './InactiveRestaurantModal';
import PropTypes from 'prop-types';

const AdminProtectedRoute = ({ children }) => {
  const { restaurantSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRehydrating, setIsRehydrating] = useState(true);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveRestaurantName, setInactiveRestaurantName] = useState('');
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => !!state.auth.user);
  const user = useSelector((state) => state.auth.user);
  const restaurant = useSelector((state) => state.auth.restaurant);
  const authStatus = useSelector((state) => state.auth.status);

  // Check if we're on a subdomain (no restaurantSlug in URL params)
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  // Helper function to check if user has admin access
  const checkAdminAccess = (user) => {
    if (!user) return false;

    // Admin roles that can access the admin interface
    const adminRoles = ['restaurant_administrator', 'location_administrator'];

    // Check primary role (backward compatibility)
    if (user.role && adminRoles.includes(user.role)) {
      return true;
    }

    // Check all roles if available (future enhancement)
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(
        (roleObj) => roleObj.role_name && adminRoles.includes(roleObj.role_name)
      );
    }

    // Check is_admin flag as fallback
    if (user.is_admin === true) {
      return true;
    }

    return false;
  };

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

  // Check restaurant status for already authenticated users
  useEffect(() => {
    if (isAuthenticated && user && restaurant) {
      if (restaurant.status === 'inactive' && user?.is_admin) {
        setInactiveRestaurantName(restaurant.name || 'Restaurante');
        setShowInactiveModal(true);
      }
    }
  }, [isAuthenticated, user, restaurant]);

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
          const restaurantData = response.data?.restaurant || response.restaurant; // Extract restaurant data
          const token = storage.get('token');

          console.log('AdminProtectedRoute - Successfully fetched user data:', userData);
          console.log(
            'AdminProtectedRoute - Successfully fetched restaurant data:',
            restaurantData
          );
          console.log('AdminProtectedRoute - Restaurant status:', restaurantData?.status);
          console.log('AdminProtectedRoute - User is_admin:', userData?.is_admin);

          // Check if restaurant is inactive and user is admin
          if (restaurantData && restaurantData.status === 'inactive' && userData?.is_admin) {
            console.log('AdminProtectedRoute - Restaurant is inactive, showing modal');
            setInactiveRestaurantName(restaurantData.name || 'Restaurante');
            setShowInactiveModal(true);
          }

          // Use simulateAuth to set both user and restaurant data
          dispatch(
            simulateAuth({
              user: userData,
              token: token,
              restaurant: restaurantData || null,
            })
          );

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
      // On subdomain, redirect to subdomain login page (not main app)
      console.log('AdminProtectedRoute - Redirecting to subdomain login page');
      return <Navigate to="/login" replace />;
    } else {
      // On main app, redirect to /:restaurantSlug/login
      return <Navigate to={`/${restaurantSlug}/login`} replace />;
    }
  }

  // Check if user has admin permissions
  // Allow users with administrator-level roles to access admin interface
  const hasAdminAccess = checkAdminAccess(user);

  console.log('AdminProtectedRoute - hasAdminAccess:', hasAdminAccess);
  console.log('AdminProtectedRoute - user.role:', user?.role);
  console.log('AdminProtectedRoute - user.roles:', user?.roles);
  console.log('AdminProtectedRoute - user.is_admin:', user?.is_admin);

  if (!hasAdminAccess) {
    console.log('AdminProtectedRoute - User lacks admin access, showing access denied message');

    // Show access denied message with option to return to app
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Acesso Negado</h2>
          <p style={{ color: '#6c757d', marginBottom: '30px', lineHeight: '1.5' }}>
            Você não tem permissão para acessar o painel administrativo. Apenas administradores de
            restaurante e administradores de unidade podem acessar esta área.
          </p>
          <button
            onClick={() => {
              if (isSubdomain) {
                window.location.href = '/';
              } else {
                window.location.href = `/${restaurantSlug}`;
              }
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#0056b3';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#007bff';
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#0056b3';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#007bff';
            }}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Voltar ao Aplicativo
          </button>
        </div>
      </div>
    );
  }

  console.log('AdminProtectedRoute - All checks passed, rendering children');
  console.log('AdminProtectedRoute - showInactiveModal:', showInactiveModal);
  console.log('AdminProtectedRoute - inactiveRestaurantName:', inactiveRestaurantName);

  const handleCloseModal = () => {
    setShowInactiveModal(false);
    // Optionally redirect to a safe page or logout after closing modal
    // For now, just close the modal and let user see the admin interface
    // They can access payment settings to reactivate
  };

  return (
    <>
      {children}
      <InactiveRestaurantModal
        show={showInactiveModal}
        restaurantName={inactiveRestaurantName}
        onClose={handleCloseModal}
      />
    </>
  );
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminProtectedRoute;
