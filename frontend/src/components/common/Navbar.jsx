import React from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Menu.scss';

const AppNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on an admin, waiter, or KDS page
  const isSpecialPortal =
    location.pathname.includes('/admin') ||
    location.pathname.includes('/waiter') ||
    location.pathname.includes('/kds');

  // Don't show regular navbar on special portals
  if (isSpecialPortal) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate(restaurantSlug ? `/${restaurantSlug}/login` : '/login');
  };

  return (
    <Navbar expand="md" fixed="top" className="py-2 navbar-bg-logo">
      <Container>
        {/* Home button on the left (tablet/desktop only) */}
        <Nav className="me-auto d-none d-md-flex">
          <Nav.Link as={Link} to="/" className="home-btn">
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
                <Nav.Link as={Link} to="/" className="home-btn">
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
                  <Button
                    variant="outline-primary"
                    as={Link}
                    to="/login"
                    size="sm"
                    className="menu-btn"
                  >
                    Login
                  </Button>
                  <Button variant="primary" as={Link} to="/register" size="sm" className="menu-btn">
                    Register
                  </Button>
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
