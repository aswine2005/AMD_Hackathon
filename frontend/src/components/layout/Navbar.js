import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { 
  FaChartLine, FaBoxes, FaTags, FaDatabase, FaHome, 
  FaCog, FaTrophy, FaStore, FaChartBar, FaListAlt,
  FaRobot, FaBrain, FaUserShield
} from 'react-icons/fa';

const Navbar = () => {
  return (
    <BsNavbar
      bg="primary"
      variant="dark"
      expand="lg"
      sticky="top"
      className="shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <Container fluid>
        <BsNavbar.Brand as={Link} to="/" className="fw-bold" aria-label="Retail Guard - Home">
          <FaChartLine className="me-2" aria-hidden="true" />
          Retail <span className="text-warning">Guard</span>
          <Badge bg="warning" text="dark" className="ms-2 fs-6">Byte Buddies</Badge>
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" aria-label="Toggle navigation menu" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto" role="menubar">
            <Nav.Link as={NavLink} to="/ai-assistant" className="d-flex align-items-center px-3 text-warning" role="menuitem" aria-label="AI Assistant">
              <FaBrain className="me-2" aria-hidden="true" /> AI Assistant
            </Nav.Link>
            <Nav.Link as={NavLink} to="/" className="d-flex align-items-center px-3" role="menuitem" aria-label="Dashboard">
              <FaHome className="me-2" aria-hidden="true" /> Dashboard
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin" className="d-flex align-items-center px-3" role="menuitem" aria-label="Today's Sales">
              <FaUserShield className="me-2" aria-hidden="true" /> Today's Sales
            </Nav.Link>
            
            {/* Categories dropdown menu */}
            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle as={Nav.Link} className="d-flex align-items-center px-3" aria-label="Categories menu" aria-haspopup="true">
                <FaStore className="me-2" aria-hidden="true" /> Categories
              </Dropdown.Toggle>
              <Dropdown.Menu role="menu">
                <Dropdown.Item as={NavLink} to="/categories" role="menuitem" aria-label="View Categories">
                  <FaListAlt className="me-2" aria-hidden="true" /> View Categories
                </Dropdown.Item>
                <Dropdown.Item as={NavLink} to="/category-management" role="menuitem" aria-label="Manage Categories">
                  <FaCog className="me-2" aria-hidden="true" /> Manage Categories
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            <Nav.Link as={NavLink} to="/products" className="d-flex align-items-center px-3" role="menuitem" aria-label="Products">
              <FaBoxes className="me-2" aria-hidden="true" /> Products
            </Nav.Link>
            <Nav.Link as={NavLink} to="/sales-data" className="d-flex align-items-center px-3" role="menuitem" aria-label="Sales Data">
              <FaDatabase className="me-2" aria-hidden="true" /> Sales Data
            </Nav.Link>
            <Nav.Link as={NavLink} to="/forecast" className="d-flex align-items-center px-3" role="menuitem" aria-label="Forecast">
              <FaChartLine className="me-2" aria-hidden="true" /> Forecast
            </Nav.Link>
            <Nav.Link as={NavLink} to="/rankings" className="d-flex align-items-center px-3" role="menuitem" aria-label="Rankings">
              <FaTrophy className="me-2" aria-hidden="true" /> Rankings
            </Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
