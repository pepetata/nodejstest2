import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { storage } from '../../store/authSlice';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import '../../styles/admin/adminNavbar.scss';

const AdminNavbar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const restaurant = useSelector((state) => state.auth.restaurant);
  // Removed excessive console logging for performance

  // Check authentication state consistency - use useMemo to prevent flickering
  const authState = useMemo(() => {
    const hasValidToken = storage.get('token');
    const isAuthenticated = !!user;
    return {
      hasValidToken,
      isAuthenticated,
      isFullyAuthenticated: isAuthenticated && hasValidToken,
    };
  }, [user]);

  // Only log authentication issues, don't automatically clear
  useEffect(() => {
    if (authState.isAuthenticated && !authState.hasValidToken) {
      console.warn('AdminNavbar - Authentication state mismatch detected');
      // Don't automatically clear - let AdminProtectedRoute handle it
    }
  }, [authState.isAuthenticated, authState.hasValidToken]);

  // Check if we're on a subdomain (no restaurantSlug in URL params)
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  // Base path for navigation - different for subdomain vs main app
  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Get restaurant URL before clearing state
      const restaurantUrl = restaurant?.url;
      const isAdmin =
        user?.role === 'restaurant_administrator' ||
        user?.role === 'superadmin' ||
        (user?.role_location_pairs &&
          user.role_location_pairs.some(
            (pair) =>
              pair.role_name === 'restaurant_administrator' ||
              pair.role_name === 'location_administrator'
          ));

      // Clear authentication data from localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');

      // Then dispatch logout action (no unwrap needed for regular actions)
      dispatch(logout());

      // Redirect to restaurant-specific login page (ALL users go to login)
      if (restaurantUrl) {
        const redirectUrl = `http://${restaurantUrl}.localhost:3000/login`;
        window.location.href = redirectUrl;
      } else {
        // Fallback to main app
        window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}?logout=true`;
      }
    } catch (error) {
      console.error('Logout error:', error);

      // Even if logout fails, clear local auth data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');

      // Try to get restaurant URL from localStorage backup
      const logoutRedirect = localStorage.getItem('logoutRedirect');
      if (logoutRedirect) {
        const { restaurantUrl } = JSON.parse(logoutRedirect);
        localStorage.removeItem('logoutRedirect');

        // ALL users go to restaurant login page
        window.location.href = `http://${restaurantUrl}.localhost:3000/login`;
      } else {
        window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}?logout=true`;
      }
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Helper function to check if user has admin access
  const checkAdminAccess = (user) => {
    if (!user) return false;

    // Admin roles that can access admin features
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

  // Helper function to check if user is specifically a restaurant administrator
  const isRestaurantAdministrator = (user) => {
    if (!user) return false;

    // Check primary role (backward compatibility)
    if (user.role === 'restaurant_administrator') {
      return true;
    }

    // Check all roles if available
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((roleObj) => roleObj.role_name === 'restaurant_administrator');
    }

    return false;
  };

  // Check if user is restaurant administrator
  const isRestaurantAdmin = checkAdminAccess(user);
  const canAccessRestaurantProfile = isRestaurantAdministrator(user);

  // Helper function to check if a route is active
  const isActiveRoute = (path) => {
    const currentPath = location.pathname;
    if (path === `${basePath}/admin`) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  // Simple authentication check - don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <nav className="admin-navbar">
        <div className="admin-navbar-container">
          {/* Left side - Restaurant logo and navigation */}
          <div className="admin-navbar-left">
            <div className="admin-restaurant-logo">
              {/* <img
                src={restaurant?.logo || '/images/restaurant-logo.png'}
                alt={`${restaurant?.name || 'Restaurant'} logo`}
                onError={(e) => {
                  e.target.src = '/public/logos/padre/logo.svg'; // TODO: use the field
                }}
              /> */}
              <div className="admin-restaurant-info">
                <span className="admin-restaurant-name">
                  {restaurant?.name || 'Restaurant Name'}
                </span>
                <span className="admin-user-name">
                  {user?.full_name || user?.username || 'User'}
                </span>
              </div>
            </div>

            <div className="admin-nav-links">
              <Link
                to={`${basePath}/admin`}
                className={`admin-nav-link ${isActiveRoute(`${basePath}/admin`) ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to={`${basePath}/admin/menu`}
                className={`admin-nav-link ${isActiveRoute(`${basePath}/admin/menu`) ? 'active' : ''}`}
              >
                Menu
              </Link>
              <Link
                to={`${basePath}/admin/users`}
                className={`admin-nav-link ${isActiveRoute(`${basePath}/admin/users`) ? 'active' : ''}`}
              >
                Usuários
              </Link>
              {canAccessRestaurantProfile && (
                <Link
                  to={`${basePath}/admin/restaurant-profile`}
                  className={`admin-nav-link ${isActiveRoute(`${basePath}/admin/restaurant-profile`) ? 'active' : ''}`}
                >
                  Perfil do Restaurante
                </Link>
              )}
              <Link
                to={`${basePath}/admin/user-profile`}
                className={`admin-nav-link ${isActiveRoute(`${basePath}/admin/user-profile`) ? 'active' : ''}`}
              >
                Meu Perfil
              </Link>
            </div>
          </div>

          {/* Right side - User actions and app logo */}
          <div className="admin-navbar-right">
            <div className="admin-user-actions">
              <button onClick={handleLogoutClick} className="admin-logout-btn">
                Sair do Sistema
              </button>
            </div>

            <div className="admin-app-logo">
              <img
                src="/images/logo.png"
                alt="App Logo"
                onError={(e) => {
                  e.target.src = '/images/default-app-logo.png';
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        show={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
};

export default AdminNavbar;
