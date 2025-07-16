import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import AppNavbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <Container
        as="main"
        className="flex-grow-1"
        style={{ paddingTop: '100px', paddingBottom: '20px' }}
      >
        {children ? children : <Outlet />}
      </Container>
      <Footer />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node,
};

export default Layout;
