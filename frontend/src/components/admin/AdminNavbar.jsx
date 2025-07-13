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
  // console.log(`AdminNavbar - user:`, user);
  // console.log(`AdminNavbar - restaurant:`, restaurant);

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
      // Clear authentication data from localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');

      // Then dispatch logout action
      await dispatch(logout()).unwrap();

      // Redirect to main app with logout parameter to force clear auth state
      window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}?logout=true`;
    } catch (error) {
      console.error('Logout error:', error);

      // Even if logout fails, clear local auth data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');
      window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}?logout=true`;
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Check if user is restaurant administrator
  const isRestaurantAdmin = user?.role === 'restaurant_admin' || user?.role === 'admin';

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
              <span className="admin-restaurant-name">{restaurant?.name || 'Restaurant Name'}</span>
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
              {isRestaurantAdmin && (
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
