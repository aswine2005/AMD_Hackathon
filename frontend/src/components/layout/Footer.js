import React from 'react';
import { Container, Row, Col, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaHome, FaChartLine, FaStore, FaTags, FaBoxes, 
  FaDatabase, FaAward, FaRobot, FaFacebook, 
  FaTwitter, FaLinkedin, FaGithub, FaInstagram, 
  FaEnvelope, FaPhone, FaMapMarkerAlt
} from 'react-icons/fa';
import './Footer.css';
import '../../animations.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-light py-5 mt-4" role="contentinfo" aria-label="Site footer">
      <Container>
        <Row className="g-4">
          <Col lg={4} md={6}>
            <h5 className="mb-4 footer-title fw-bold">
              <FaChartLine className="me-2" aria-hidden="true" /> Sales Forecasting ML
            </h5>
            <p className="mb-3">
              Advanced sales forecasting platform powered by machine learning algorithms.
              Get accurate predictions and insights to drive your business forward.
            </p>
            <nav aria-label="Social media links">
              <div className="d-flex gap-3 mb-4 social-icons">
                <a href="https://facebook.com" target="_blank" className="text-light social-icon" aria-label="Visit our Facebook page" rel="noopener noreferrer">
                  <FaFacebook size={20} aria-hidden="true" />
                </a>
                <a href="https://twitter.com" target="_blank" className="text-light social-icon" aria-label="Visit our Twitter page" rel="noopener noreferrer">
                  <FaTwitter size={20} aria-hidden="true" />
                </a>
                <a href="https://linkedin.com" target="_blank" className="text-light social-icon" aria-label="Visit our LinkedIn page" rel="noopener noreferrer">
                  <FaLinkedin size={20} aria-hidden="true" />
                </a>
                <a href="https://github.com/aswine2005/AMD_Hackathon" target="_blank" className="text-light social-icon" aria-label="Visit our GitHub repository" rel="noopener noreferrer">
                  <FaGithub size={20} aria-hidden="true" />
                </a>
                <a href="https://instagram.com" target="_blank" className="text-light social-icon" aria-label="Visit our Instagram page" rel="noopener noreferrer">
                  <FaInstagram size={20} aria-hidden="true" />
                </a>
              </div>
            </nav>
          </Col>
          
          <Col lg={3} md={6}>
            <h5 className="mb-4 footer-title fw-bold" id="footer-quick-links">Quick Links</h5>
            <ListGroup variant="flush" className="footer-links" aria-labelledby="footer-quick-links">
              <ListGroup.Item as={Link} to="/" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaHome className="me-2" aria-hidden="true" /> Dashboard
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/forecast" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaChartLine className="me-2" aria-hidden="true" /> Forecast
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/products" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaBoxes className="me-2" aria-hidden="true" /> Products
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/categories" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaTags className="me-2" aria-hidden="true" /> Categories
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/rankings" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaAward className="me-2" aria-hidden="true" /> Rankings
              </ListGroup.Item>
            </ListGroup>
          </Col>
          
          <Col lg={2} md={6}>
            <h5 className="mb-4 footer-title fw-bold" id="footer-resources">Resources</h5>
            <ListGroup variant="flush" className="footer-links" aria-labelledby="footer-resources">
              <ListGroup.Item as={Link} to="/ai-assistant" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaRobot className="me-2" aria-hidden="true" /> AI Assistant
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/admin" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaStore className="me-2" aria-hidden="true" /> Admin
              </ListGroup.Item>
              <ListGroup.Item as={Link} to="/sales-data" className="bg-transparent text-light border-0 ps-0 py-2 d-flex align-items-center">
                <FaDatabase className="me-2" aria-hidden="true" /> Sales Data
              </ListGroup.Item>
            </ListGroup>
          </Col>
          
          <Col lg={3} md={6}>
            <h5 className="mb-4 footer-title fw-bold">Contact</h5>
            <address className="footer-contact" style={{ fontStyle: 'normal' }}>
              <p className="mb-2 d-flex align-items-center">
                <FaMapMarkerAlt className="me-3" aria-hidden="true" />
                <span>Sri Eshwar College Of Engineering</span>
              </p>
              <p className="mb-2 d-flex align-items-center">
                <FaPhone className="me-3" aria-hidden="true" />
                <a href="tel:+919842795095" className="text-light" aria-label="Call +91 98427 95095">+91 98427 95095</a>
              </p>
              <p className="mb-2 d-flex align-items-center">
                <FaEnvelope className="me-3" aria-hidden="true" />
                <a href="mailto:aswinelaiya@gmail.com" className="text-light" aria-label="Email aswinelaiya@gmail.com">aswinelaiya@gmail.com</a>
              </p>
            </address>
          </Col>
        </Row>
        
        <hr className="my-4 bg-secondary" />
        
        <Row>
          <Col>
            <p className="text-center mb-0">
              &copy; {currentYear} Sales Forecasting ML | Powered by ByteBuddies | All Rights Reserved
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
