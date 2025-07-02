import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';

const Home = ({ source }) => {
  return (
    <Container className="py-3">
      <Row className="justify-content-center text-center">
        <Col md={8}>
          <div className="bg-primary text-white p-5 rounded mb-4">
            <h1 className="display-4">Welcome to A la carte</h1>
            <p className="lead">Your complete restaurant ordering and management platform</p>
            <hr className="my-4" />
            <p>Get started by creating an account or logging in to access your restaurant.</p>
            <div className="mt-4">
              <Button
                variant="light"
                size="lg"
                as={Link}
                to="/register-restaurant"
                className="me-3"
              >
                Register Your Restaurant
              </Button>
              <Button variant="outline-light" size="lg" as={Link} to="/login">
                Sign In
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={4} className="text-center mb-4">
          <h3>For Restaurants</h3>
          <p>Manage your menu, orders, and staff with our comprehensive platform.</p>
          <Button variant="outline-primary" as={Link} to="/register-restaurant">
            Register Your Restaurant
          </Button>
        </Col>
        <Col md={4} className="text-center mb-4">
          <h3>For Customers</h3>
          <p>Browse menus and place orders from your favorite restaurants.</p>
          <Button variant="outline-primary" as={Link} to="/login">
            Start Ordering
          </Button>
        </Col>
        <Col md={4} className="text-center mb-4">
          <h3>For Staff</h3>
          <p>Access waiter and kitchen tools to manage orders efficiently.</p>
          <Button variant="outline-primary" as={Link} to="/login">
            Staff Login
          </Button>
        </Col>
      </Row>

      {source && (
        <Row className="mt-5">
          <Col>
            <div className="alert alert-info">
              <strong>Debug Info:</strong> Source: {source}
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

Home.propTypes = {
  source: PropTypes.string,
};

export default Home;
