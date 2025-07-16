import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import HomeAuthButton from '../../components/auth/HomeAuthButton';
import RouteGuard from '../../components/auth/RouteGuard';
import AuthStateDebugger from '../../components/debug/AuthStateDebugger';

const Home = ({ source }) => {
  const { user, token } = useSelector((state) => state.auth);
  const isAuthenticated = !!user && !!token;

  return (
    <RouteGuard>
      <Container className="py-3">
        <Row className="justify-content-center text-center">
          <Col md={8}>
            <div className="bg-primary text-white p-5 rounded mb-4">
              <h1 className="display-4">Welcome to A la carte</h1>
              <p className="lead">Your complete restaurant ordering and management platform</p>
              <hr className="my-4" />

              {isAuthenticated ? (
                // Authenticated user content
                <>
                  <p>
                    Bem-vindo de volta! Acesse seu painel de controle ou explore as funcionalidades.
                  </p>
                  <div className="mt-4">
                    <HomeAuthButton className="btn btn-lg btn-light me-3" />
                    <Button
                      variant="outline-light"
                      size="lg"
                      onClick={() => {
                        // TODO: Navigate to user's appropriate area based on role
                        console.log('TODO: Navigate to user area based on role');
                        alert('Área em desenvolvimento para seu tipo de usuário.');
                      }}
                    >
                      Explorar Funcionalidades
                    </Button>
                  </div>
                </>
              ) : (
                // Unauthenticated user content
                <>
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
                    <HomeAuthButton className="btn btn-lg btn-outline-light" />
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>

        {/* Show different content based on authentication */}
        {isAuthenticated ? (
          // Authenticated user sections
          <Row className="mt-5">
            <Col md={4} className="text-center mb-4">
              <h3>Painel de Controle</h3>
              <p>Gerencie seu restaurante, cardápio e pedidos com nossa plataforma completa.</p>
              <HomeAuthButton className="btn btn-outline-primary" />
            </Col>
            <Col md={4} className="text-center mb-4">
              <h3>Relatórios</h3>
              <p>Acompanhe o desempenho do seu negócio com relatórios detalhados.</p>
              <Button
                variant="outline-primary"
                onClick={() => {
                  console.log('TODO: Navigate to reports');
                  alert('Relatórios em desenvolvimento.');
                }}
              >
                Ver Relatórios
              </Button>
            </Col>
            <Col md={4} className="text-center mb-4">
              <h3>Configurações</h3>
              <p>Ajuste as configurações do seu restaurante e perfil de usuário.</p>
              <Button
                variant="outline-primary"
                onClick={() => {
                  console.log('TODO: Navigate to settings');
                  alert('Configurações em desenvolvimento.');
                }}
              >
                Configurações
              </Button>
            </Col>
          </Row>
        ) : (
          // Unauthenticated user sections
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
              <HomeAuthButton className="btn btn-outline-primary" />
            </Col>
            <Col md={4} className="text-center mb-4">
              <h3>For Staff</h3>
              <p>Access waiter and kitchen tools to manage orders efficiently.</p>
              <HomeAuthButton className="btn btn-outline-primary" />
            </Col>
          </Row>
        )}

        {source && (
          <Row className="mt-5">
            <Col>
              <div className="alert alert-info">
                <strong>Debug Info:</strong> Source: {source}
              </div>
            </Col>
          </Row>
        )}

        {/* Temporary Auth State Debugger */}
        <AuthStateDebugger />
      </Container>
    </RouteGuard>
  );
};

Home.propTypes = {
  source: PropTypes.string,
};

export default Home;
