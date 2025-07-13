import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import '../../styles/admin/adminNavbar.scss';

const AdminNavbar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // Check if we're on a subdomain (no restaurantSlug in URL params)
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  // Base path for navigation - different for subdomain vs main app
  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  // Mock restaurant data - in real app this would come from API/context
  const restaurant = {
    name: 'Restaurant Name',
    logo: '/images/restaurant-logo.png', // placeholder
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      navigate('/');
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

  return (
    <>
      <nav className="admin-navbar">
        <div className="admin-navbar-container">
          {/* Left side - Restaurant logo and navigation */}
          <div className="admin-navbar-left">
            <div className="admin-restaurant-logo">
              <img
                src={restaurant.logo}
                alt={`${restaurant.name} logo`}
                onError={(e) => {
                  e.target.src = '/images/default-restaurant-logo.png';
                }}
              />
              <span className="admin-restaurant-name">{restaurant.name}</span>
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
              <span className="admin-user-welcome">Olá, {user?.name || user?.email}</span>
              <button onClick={handleLogoutClick} className="admin-logout-btn">
                Sair do Sistema
              </button>
            </div>

            <div className="admin-app-logo">
              <Link to="/">
                <img
                  src="/images/app-logo.png"
                  alt="App Logo"
                  onError={(e) => {
                    e.target.src = '/images/default-app-logo.png';
                  }}
                />
              </Link>
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
