import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center shadow">
            <Card.Body className="p-5">
              <FaExclamationTriangle className="text-warning" size={60} />
              <h1 className="mt-4 mb-3">404</h1>
              <h3 className="mb-4">Page Not Found</h3>
              <p className="mb-4">
                The page you are looking for does not exist or has been moved.
              </p>
              <Button as={Link} to="/" variant="primary" size="lg">
                <FaHome className="me-2" />
                Back to Dashboard
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
