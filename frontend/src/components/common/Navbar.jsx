import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { logout, rehydrate } from '../../store/authSlice';
import LogoutConfirmationModal from '../admin/LogoutConfirmationModal';
import '../../styles/Menu.scss';

const AppNavbar = () => {
  const { user, token, restaurant, status } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Enhanced authentication check - check both Redux state and storage
  const hasStoredToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  const isAuthenticated = !!user && !!token && !!hasStoredToken;

  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  // Check if we're on a subdomain
  const subdomain = window.location.hostname.split('.')[0];
  const isSubdomain = subdomain && subdomain !== 'localhost' && subdomain !== 'www';

  // Check if we're still rehydrating (loading initial auth state)
  const isRehydrating = status === 'loading' || (hasStoredToken && !user && status === 'idle');

  // Force rehydration when returning to main domain if we have a token but no user
  useEffect(() => {
    if (!isSubdomain && hasStoredToken && (!user || !token) && status !== 'loading') {
      console.log('Navbar: Force rehydration - token exists but no user in Redux');
      dispatch(rehydrate());
    }
  }, [dispatch, hasStoredToken, user, token, isSubdomain, status]);

  // Debug authentication state
  useEffect(() => {
    console.log('Navbar auth state:', {
      hasStoredToken: !!hasStoredToken,
      hasUser: !!user,
      hasToken: !!token,
      isAuthenticated,
      isAdmin,
      hasRestaurant,
      status,
      isRehydrating,
      location: location.pathname,
    });
  }, [
    hasStoredToken,
    user,
    token,
    isAuthenticated,
    isAdmin,
    hasRestaurant,
    location.pathname,
    status,
    isRehydrating,
  ]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Get restaurant URL before clearing state
      const restaurantUrl = restaurant?.url;

      // Clear authentication data from localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');

      // Then dispatch logout action (no unwrap needed for regular actions)
      dispatch(logout());

      // Redirect to restaurant-specific page (ALL users go to login)
      if (restaurantUrl) {
        // ALL users go to restaurant login page
        window.location.href = `http://${restaurantUrl}.localhost:3000/login`;
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

  const handleAccessPanel = () => {
    if (isAdmin && hasRestaurant) {
      const restaurantUrl = restaurant.url;
      const redirectUrl = `http://${restaurantUrl}.localhost:3000/admin`;
      window.location.href = redirectUrl;
    } else {
      // TODO: Handle non-admin user navigation
      console.log('TODO: Navigate non-admin user to appropriate area');
      alert('Área em desenvolvimento para seu tipo de usuário.');
    }
  };

  return (
    <Navbar expand="md" fixed="top" className="py-2 navbar-bg-logo">
      <Container>
        {/* Home button on the left (tablet/desktop only) */}

        <Nav className="me-auto d-none d-md-flex">
          <Nav.Link
            as="button"
            className="home-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'inherit',
              cursor: 'pointer',
            }}
            onClick={() => {
              // Always go to main app host (no subdomain)
              window.location.href = import.meta.env.VITE_API_URL || 'http://localhost:3000/';
            }}
          >
            Home
          </Nav.Link>
        </Nav>

        {/* Single Logo - positioned differently based on screen size */}
        <Navbar.Brand as={Link} to="/" className="navbar-logo">
          <img src="/images/logo.png" alt="A la carte" className="logo-img" />
        </Navbar.Brand>

        {/* Hamburger toggle for mobile only */}
        <Navbar.Toggle aria-controls="main-navbar-nav" />

        {/* Collapsible content */}
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="w-100">
            {/* All buttons on the right side when collapsed */}
            <div className="ms-auto d-flex flex-column flex-md-row align-items-center gap-2">
              {/* Home button (mobile only) - include in the right side stack */}

              <div className="d-md-none">
                <Nav.Link
                  as="button"
                  className="home-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    window.location.href =
                      import.meta.env.VITE_APP_HOST || 'http://localhost:3000/';
                  }}
                >
                  Home
                </Nav.Link>
              </div>

              {/* Authentication buttons */}
              {isRehydrating ? (
                // Show placeholder while rehydrating
                <div className="d-flex align-items-center">
                  <small className="text-muted">Carregando...</small>
                </div>
              ) : isAuthenticated ? (
                // Authenticated user buttons
                <>
                  {isAdmin && hasRestaurant && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="menu-btn"
                      onClick={handleAccessPanel}
                    >
                      Meu Painel
                    </Button>
                  )}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="menu-btn"
                    onClick={handleLogoutClick}
                  >
                    Sair do Sistema
                  </Button>
                </>
              ) : (
                // Unauthenticated user buttons
                <>
                  {/* Hide Entrar button on /login page ONLY on main domain */}
                  {!(location.pathname === '/login' && !isSubdomain) && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="menu-btn"
                      onClick={() => {
                        if (isSubdomain) {
                          // If on subdomain, redirect to main domain login
                          window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/login`;
                        } else {
                          // If on main domain, use React Router navigation
                          window.location.pathname = '/login';
                        }
                      }}
                    >
                      Entrar
                    </Button>
                  )}
                  {/* Hide Registrar button on register page */}
                  {!location.pathname.includes('/register') && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="menu-btn"
                      onClick={() => {
                        if (isSubdomain) {
                          // If on subdomain, redirect to main domain register
                          window.location.href = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/register`;
                        } else {
                          // If on main domain, use React Router navigation
                          window.location.pathname = '/register';
                        }
                      }}
                    >
                      Registrar
                    </Button>
                  )}
                </>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        show={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </Navbar>
  );
};

export default AppNavbar;
