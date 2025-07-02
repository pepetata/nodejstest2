import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';

const Menu = () => {
  const { restaurantSlug } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock menu data for now
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMenuItems([
        {
          id: 1,
          name: 'Classic Burger',
          description: 'Juicy beef patty with lettuce, tomato, and special sauce',
          price: 12.99,
          category: 'Main Course',
          image: 'https://via.placeholder.com/300x200?text=Classic+Burger',
        },
        {
          id: 2,
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing and croutons',
          price: 8.99,
          category: 'Salads',
          image: 'https://via.placeholder.com/300x200?text=Caesar+Salad',
        },
        {
          id: 3,
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, tomato sauce, and basil',
          price: 14.99,
          category: 'Pizza',
          image: 'https://via.placeholder.com/300x200?text=Margherita+Pizza',
        },
        {
          id: 4,
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake with chocolate frosting',
          price: 6.99,
          category: 'Desserts',
          image: 'https://via.placeholder.com/300x200?text=Chocolate+Cake',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <h2>Loading menu...</h2>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-4">
            {restaurantSlug
              ? `${restaurantSlug.charAt(0).toUpperCase() + restaurantSlug.slice(1)} Menu`
              : 'Our Menu'}
          </h1>
          <p className="text-center text-muted">Discover our delicious selection of dishes</p>
        </Col>
      </Row>

      <Row>
        {menuItems.map((item) => (
          <Col md={6} lg={4} key={item.id} className="mb-4">
            <Card className="h-100">
              <Card.Img
                variant="top"
                src={item.image}
                alt={item.name}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <Card.Body className="d-flex flex-column">
                <div className="mb-2">
                  <Badge bg="secondary" className="mb-2">
                    {item.category}
                  </Badge>
                </div>
                <Card.Title>{item.name}</Card.Title>
                <Card.Text className="flex-grow-1">{item.description}</Card.Text>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0 text-primary">${item.price}</span>
                    <Button variant="primary" size="sm">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Menu;
