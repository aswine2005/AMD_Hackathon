import React, { useState } from 'react';
import { 
  Card, Row, Col, Badge, Table, Alert, Button,
  ProgressBar, Dropdown 
} from 'react-bootstrap';
import { 
  FaStore, FaChartLine, FaPeopleCarry, FaExchangeAlt, 
  FaArrowDown, FaClock, FaUserClock
} from 'react-icons/fa';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { motion } from 'framer-motion';

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const CategoryAnalytics = ({ category, products, timeRange = 7 }) => {
  const [sortBy, setSortBy] = useState('profit');
  const [showImprovementSuggestions, setShowImprovementSuggestions] = useState(false);

  // Use real data from props instead of mock data
  const performanceData = (category.performanceData && category.performanceData.length > 0) 
    ? category.performanceData 
    : [];

  // If no category data is provided, show a message
  if (!category) {
    return (
      <Alert variant="info">
        <FaStore className="me-2" /> 
        Select a category to view analytics
      </Alert>
    );
  }

  // Sort products by the selected criterion
  const sortedProducts = products ? [...products].sort((a, b) => {
    if (sortBy === 'sales') return (b.salesCount || 0) - (a.salesCount || 0);
    if (sortBy === 'profit') return (b.profit || 0) - (a.profit || 0);
    if (sortBy === 'engagement') return (b.engagementScore || 0) - (a.engagementScore || 0);
    return 0;
  }) : [];

  // Calculate ranking positions
  const rankedProducts = sortedProducts.map((product, index) => ({
    ...product,
    rank: index + 1
  }));

  // Get top and bottom products
  const topProducts = rankedProducts.slice(0, 3);
  const bottomProducts = [...rankedProducts].reverse().slice(0, 3);

  // Format profit/revenue as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Generate improvement suggestions for low-performing products
  const generateImprovement = (product) => {
    const suggestions = [];
    
    if (product.engagementScore < 50) {
      suggestions.push('Low engagement score - consider better placement or improved signage');
    }
    
    if (product.averageDwellTime < 2) {
      suggestions.push('Customers spend little time - add interactive displays or product information');
    }
    
    if (product.profit < 1000) {
      suggestions.push('Low profit margin - consider pricing strategy adjustments');
    }
    
    if (product.salesCount < 50) {
      suggestions.push('Low sales volume - try promotional offers or bundling with popular items');
    }
    
    return suggestions.length > 0 ? suggestions : ['No specific improvements needed'];
  };

  // Prepare radar chart data for category metrics - only use actual data
  const radarData = [
    {
      subject: 'Engagement',
      A: category.engagementScore ? category.engagementScore : null,
      fullMark: 100,
    },
    {
      subject: 'Interest',
      A: category.interestRate ? category.interestRate : null,
      fullMark: 100,
    },
    {
      subject: 'Dwell Time',
      A: category.averageDwellTime ? category.averageDwellTime * 10 : null, // Scale to 0-100
      fullMark: 100,
    },
    {
      subject: 'Crowd',
      A: category.crowdDensity ? category.crowdDensity * 10 : null, // Scale to 0-100
      fullMark: 100,
    },
    {
      subject: 'Visitors',
      A: category.averageVisitors ? Math.min(category.averageVisitors / 2, 100) : null, // Scale to 0-100
      fullMark: 100,
    },
  ].filter(item => item.A !== null); // Only include metrics that have real data

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="category-analytics"
    >
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaStore className="me-2" /> 
                Category Analytics: {category.name}
              </h5>
              {category.rackNumber && (
                <Badge bg="light" text="dark" className="p-2">
                  Rack: {category.rackNumber}
                </Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-4">
              <Col md={8}>
                <h6>Performance Overview</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8" 
                      name="Sales Count" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#82ca9d" 
                      name="Profit (₹)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Col>
              <Col md={4}>
                <h6>Category Metrics</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart outerRadius={90} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={category.name}
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">
                        <FaChartLine className="me-2 text-success" /> 
                        Top Performing Products
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table hover size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Product</th>
                            <th>
                              <Dropdown onSelect={(key) => setSortBy(key)}>
                                <Dropdown.Toggle variant="link" size="sm" className="p-0">
                                  {sortBy === 'sales' ? 'Sales' : 
                                   sortBy === 'profit' ? 'Profit' : 'Engagement'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item eventKey="sales">Sales</Dropdown.Item>
                                  <Dropdown.Item eventKey="profit">Profit</Dropdown.Item>
                                  <Dropdown.Item eventKey="engagement">Engagement</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map(product => (
                            <tr key={product._id || product.id}>
                              <td>
                                <Badge bg="success">{product.rank}</Badge>
                              </td>
                              <td>{product.name}</td>
                              <td>
                                {sortBy === 'sales' && (product.salesCount || 0)}
                                {sortBy === 'profit' && formatCurrency(product.profit || 0)}
                                {sortBy === 'engagement' && (
                                  <ProgressBar 
                                    now={product.engagementScore || 0} 
                                    label={`${product.engagementScore || 0}%`}
                                    variant="success" 
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
              <Col md={6}>
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">
                        <FaArrowDown className="me-2 text-danger" /> 
                        Products Needing Improvement
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table hover size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Product</th>
                            <th>
                              {sortBy === 'sales' ? 'Sales' : 
                               sortBy === 'profit' ? 'Profit' : 'Engagement'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bottomProducts.map(product => (
                            <tr key={product._id || product.id}>
                              <td>
                                <Badge bg="danger">{rankedProducts.length - product.rank + 1}</Badge>
                              </td>
                              <td>{product.name}</td>
                              <td>
                                {sortBy === 'sales' && (product.salesCount || 0)}
                                {sortBy === 'profit' && formatCurrency(product.profit || 0)}
                                {sortBy === 'engagement' && (
                                  <ProgressBar 
                                    now={product.engagementScore || 0} 
                                    label={`${product.engagementScore || 0}%`}
                                    variant="danger" 
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>

            <Row>
              <Col>
                <motion.div 
                  variants={itemVariants}
                  animate={{ height: showImprovementSuggestions ? 'auto' : 0 }}
                  className="overflow-hidden"
                >
                  <Card className="shadow-sm mb-3">
                    <Card.Header className="bg-warning">
                      <h6 className="mb-0 text-dark">
                        <FaExchangeAlt className="me-2" /> 
                        Improvement Suggestions
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {bottomProducts.map(product => (
                          <Col md={4} key={product._id || product.id} className="mb-3">
                            <Card className="h-100 border">
                              <Card.Header className="py-2">
                                <small>
                                  <strong>{product.name}</strong>
                                </small>
                              </Card.Header>
                              <Card.Body className="py-2">
                                <ul className="small ps-3 mb-0">
                                  {generateImprovement(product).map((suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                  ))}
                                </ul>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                </motion.div>
                <div className="text-center">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setShowImprovementSuggestions(!showImprovementSuggestions)}
                  >
                    {showImprovementSuggestions ? 'Hide Suggestions' : 'Show Improvement Suggestions'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <FaClock className="me-2 text-primary" />
              Customer Engagement Metrics
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Table bordered hover size="sm">
                  <tbody>
                    <tr>
                      <td width="50%">Engagement Score</td>
                      <td>
                        {category.engagementScore ? (
                          <ProgressBar 
                            now={category.engagementScore} 
                            label={`${category.engagementScore}%`}
                            variant={
                              category.engagementScore > 70 ? 'success' : 
                              category.engagementScore > 40 ? 'warning' : 'danger'
                            }
                          />
                        ) : (
                          <Alert variant="warning" className="p-1 text-center">No data</Alert>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Average Dwell Time</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaUserClock className="me-2 text-info" />
                          {category.averageDwellTime ? (
                            <span>{category.averageDwellTime} minutes</span>
                          ) : (
                            <span className="text-muted">No data available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Interest Rate</td>
                      <td>
                        {category.interestRate ? (
                          <Badge bg="primary" className="p-2">
                            {category.interestRate}%
                          </Badge>
                        ) : (
                          <span className="text-muted">No data</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <Table bordered hover size="sm">
                  <tbody>
                    <tr>
                      <td width="50%">Crowd Density</td>
                      <td>
                        {category.crowdDensity ? (
                          <div className="d-flex align-items-center">
                            <Badge bg="info" className="p-2">
                              {category.crowdDensity}/10
                            </Badge>
                            <span className="ms-2">
                              {category.crowdDensity > 7 ? 'High' : 
                               category.crowdDensity > 3 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">No data available</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Average Visitors</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaPeopleCarry className="me-2 text-warning" />
                          {category.averageVisitors ? (
                            <span>{category.averageVisitors}/day</span>
                          ) : (
                            <span className="text-muted">No data available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Store Location</td>
                      <td>
                        <Badge 
                          bg={
                            (category.locationInStore === 'front' || category.locationInStore === 'entrance') ? 'success' : 
                            (category.locationInStore === 'middle') ? 'primary' : 'secondary'
                          } 
                          className="p-2"
                        >
                          {category.locationInStore || 'middle'} section
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CategoryAnalytics;
