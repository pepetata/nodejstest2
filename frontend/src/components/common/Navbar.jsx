import React from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import '../../styles/Menu.scss';

const AppNavbar = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = !!user;
  const dispatch = useDispatch();
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Navbar is always visible

  const handleLogout = async () => {
    try {
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
    navigate(restaurantSlug ? `/${restaurantSlug}/login` : '/login');
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
              {isAuthenticated ? (
                <Nav.Link href="#" onClick={handleLogout} className="menu-btn">
                  Welcome, {user?.name || 'User'} - Logout
                </Nav.Link>
              ) : (
                <>
                  {/* Hide Entrar button on /login page */}
                  {location.pathname !== '/login' && (
                    <Button
                      variant="outline-primary"
                      as={Link}
                      to="/login"
                      size="sm"
                      className="menu-btn"
                    >
                      Entrar
                    </Button>
                  )}
                  {/* Hide Registrar button on register page */}
                  {!location.pathname.includes('/register') && (
                    <Button
                      variant="primary"
                      as={Link}
                      to="/register"
                      size="sm"
                      className="menu-btn"
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
    </Navbar>
  );
};

export default AppNavbar;
