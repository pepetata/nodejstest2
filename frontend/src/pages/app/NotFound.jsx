import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import Layout from '../../components/common/Layout';
import '../../styles/NotFound.scss';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="min-vh-100 d-flex align-items-center justify-content-center py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} xl={6}>
              <Card className="border-0 shadow-lg">
                <Card.Body className="p-5 text-center">
                  {/* Animated 404 with background decoration */}
                  <div className="position-relative mb-4">
                    <div className="not-found-bg-number">404</div>
                    <div className="not-found-content">
                      <div className="mb-4">
                        <div className="not-found-icon-container">
                          <i className="fas fa-exclamation-triangle not-found-icon" />
                        </div>
                      </div>

                      <h1 className="display-4 fw-bold text-dark mb-3">Página Não Encontrada</h1>

                      <p className="lead text-muted mb-4">
                        Ops! A página que você está procurando não existe ou foi movida. Não se
                        preocupe, isso acontece com os melhores de nós!
                      </p>

                      <div className="mb-4">
                        <p className="text-muted small">Possíveis motivos:</p>
                        <ul className="list-unstyled text-muted small">
                          <li className="mb-1">• A URL foi digitada incorretamente</li>
                          <li className="mb-1">• A página foi movida ou removida</li>
                          <li className="mb-1">• O link pode estar quebrado</li>
                        </ul>
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                        <Button as={Link} to="/" variant="primary" size="lg" className="px-4 py-2">
                          <i className="fas fa-home me-2" />
                          Voltar ao Início
                        </Button>

                        <Button
                          variant="outline-secondary"
                          size="lg"
                          className="px-4 py-2"
                          onClick={() => window.history.back()}
                        >
                          <i className="fas fa-arrow-left me-2" />
                          Página Anterior
                        </Button>
                      </div>

                      {/* Help section */}
                      <div className="mt-5 pt-4 border-top">
                        <h6 className="text-muted mb-3">Precisa de ajuda?</h6>
                        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                          <Button
                            as={Link}
                            to="/contact"
                            variant="link"
                            className="text-decoration-none"
                          >
                            <i className="fas fa-envelope me-2" />
                            Entre em Contato
                          </Button>

                          <Button
                            as={Link}
                            to="/help"
                            variant="link"
                            className="text-decoration-none"
                          >
                            <i className="fas fa-question-circle me-2" />
                            Central de Ajuda
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional helpful links section */}
          <Row className="justify-content-center mt-5">
            <Col lg={10}>
              <div className="text-center">
                <h5 className="text-muted mb-4">Talvez você esteja procurando por:</h5>
                <Row className="g-3">
                  <Col md={3} sm={6}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                      <Card.Body className="text-center p-4">
                        <i className="fas fa-utensils not-found-card-icon" />
                        <h6 className="mb-2">Menu</h6>
                        <p className="text-muted small mb-3">Veja nossos pratos deliciosos</p>
                        <Button as={Link} to="/menu" variant="outline-primary" size="sm">
                          Ver Menu
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3} sm={6}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                      <Card.Body className="text-center p-4">
                        <i className="fas fa-map-marker-alt not-found-card-icon" />
                        <h6 className="mb-2">Localização</h6>
                        <p className="text-muted small mb-3">Encontre-nos facilmente</p>
                        <Button as={Link} to="/location" variant="outline-primary" size="sm">
                          Ver Mapa
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3} sm={6}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                      <Card.Body className="text-center p-4">
                        <i className="fas fa-phone not-found-card-icon" />
                        <h6 className="mb-2">Contato</h6>
                        <p className="text-muted small mb-3">Fale conosco</p>
                        <Button as={Link} to="/contact" variant="outline-primary" size="sm">
                          Contatar
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={3} sm={6}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                      <Card.Body className="text-center p-4">
                        <i className="fas fa-info-circle not-found-card-icon" />
                        <h6 className="mb-2">Sobre Nós</h6>
                        <p className="text-muted small mb-3">Conheça nossa história</p>
                        <Button as={Link} to="/about" variant="outline-primary" size="sm">
                          Saber Mais
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
