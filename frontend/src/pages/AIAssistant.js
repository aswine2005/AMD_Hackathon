import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import AISalesAssistant from '../components/AISalesAssistant';
import { FaRobot, FaBrain, FaMicrophone, FaExchangeAlt, FaChartLine } from 'react-icons/fa';

const AIAssistant = () => {
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 d-flex align-items-center">
              <FaRobot className="me-3 text-primary" />
              AI Sales Assistant
            </h2>
            <p className="lead">Your intelligent companion for sales insights, inventory management, and business guidance.</p>
          </motion.div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4"
          >
            <AISalesAssistant />
          </motion.div>
        </Col>
        
        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaBrain className="me-2" /> AI Capabilities
                </h5>
              </Card.Header>
              <Card.Body>
                <ul className="feature-list">
                  <motion.li 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-3"
                  >
                    <div className="d-flex">
                      <div className="feature-icon bg-primary text-white rounded-circle p-2 me-3">
                        <FaChartLine />
                      </div>
                      <div>
                        <h6>Real-time Sales Analysis</h6>
                        <p className="text-muted small mb-0">Ask about product performance across markets.</p>
                      </div>
                    </div>
                  </motion.li>
                  
                  <motion.li 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-3"
                  >
                    <div className="d-flex">
                      <div className="feature-icon bg-success text-white rounded-circle p-2 me-3">
                        <FaExchangeAlt />
                      </div>
                      <div>
                        <h6>Smart Navigation</h6>
                        <p className="text-muted small mb-0">Request navigation to any section of the platform.</p>
                      </div>
                    </div>
                  </motion.li>
                  
                  <motion.li 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-3"
                  >
                    <div className="d-flex">
                      <div className="feature-icon bg-info text-white rounded-circle p-2 me-3">
                        <FaMicrophone />
                      </div>
                      <div>
                        <h6>Voice Interaction</h6>
                        <p className="text-muted small mb-0">Speak to the assistant using the voice command feature.</p>
                      </div>
                    </div>
                  </motion.li>
                </ul>
              </Card.Body>
            </Card>
            
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">Sample Questions</h5>
              </Card.Header>
              <Card.Body>
                <div className="sample-questions">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="sample-question bg-light p-2 rounded mb-2"
                  >
                    "How are the sales of Lays chips this month?"
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="sample-question bg-light p-2 rounded mb-2"
                  >
                    "Take me to the forecast page."
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="sample-question bg-light p-2 rounded mb-2"
                  >
                    "What's the best strategy to maintain optimal stock levels?"
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="sample-question bg-light p-2 rounded"
                  >
                    "Show me the worst-performing products this week."
                  </motion.div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default AIAssistant;
