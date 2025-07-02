import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import AppNavbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <Container
        as="main"
        className="flex-grow-1"
        style={{ paddingTop: '100px', paddingBottom: '20px' }}
      >
        <Outlet />
      </Container>
      <Footer />
    </div>
  );
};

// Layout doesn't need prop-types as it doesn't receive any props
export default Layout;
