import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Row, Col } from 'react-bootstrap';

const NotFoundPage = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center text-center min-vh-75 align-items-center">
        <Col md={8} lg={6}>
          <div className="mb-4">
            {/* Large 404 with gradient background */}
            <div className="position-relative mb-4">
              <h1
                className="display-1 fw-bold text-primary opacity-25"
                style={{ fontSize: '8rem' }}
              >
                404
              </h1>
              <div className="position-absolute top-50 start-50 translate-middle">
                <i
                  className="fas fa-search text-primary opacity-50"
                  style={{ fontSize: '4rem' }}
                ></i>
              </div>
            </div>

            {/* Error message */}
            <h2 className="h3 fw-bold text-dark mb-3">Oops! Page Not Found</h2>

            <p className="text-muted mb-4 lead">
              The page you're looking for doesn't exist or has been moved. Don't worry, it happens
              to the best of us!
            </p>

            {/* Action buttons */}
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <Button as={Link} to="/" variant="primary" size="lg" className="px-4">
                <i className="fas fa-home me-2"></i>
                Back to Home
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
