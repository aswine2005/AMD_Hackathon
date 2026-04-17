import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { 
  FaEnvelope, FaShare, FaCheck, FaPaperPlane, FaRegCopy, 
  FaClock
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';

/**
 * Enhanced ShareForecastModal component for sharing forecast data via email
 */
const ShareForecastModal = ({ show, onHide, forecastData, weatherData, analyticsData, stockData, onNewMessage }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [includeWeather, setIncludeWeather] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeStock, setIncludeStock] = useState(true);
  const [customSubject, setCustomSubject] = useState('');
  const [scheduleType, setScheduleType] = useState('now'); // 'now', 'once', 'daily'
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [dailyTime, setDailyTime] = useState('');

  // Reset form state when modal is opened/closed
  useEffect(() => {
    if (!show) {
      setTimeout(() => {
        resetForm();
      }, 300); // Small delay to allow modal close animation
    }
  }, [show]);

  const resetForm = () => {
    setEmail('');
    setAdditionalMessage('');
    setShareSuccess(false);
    setErrorMessage('');
    setEmailSent(false);
    setIncludeWeather(true);
    setIncludeAnalytics(true);
    setIncludeStock(true);
    setCustomSubject('');
    setScheduleType('now');
    setScheduleDateTime('');
    setDailyTime('');
  };

  // Handle modal close
  const handleClose = () => {
    onHide();
  };

  // Get forecast type and name for email subject
  const getForecastDisplayInfo = () => {
    if (!forecastData) return { type: 'Forecast', name: 'Data' };
    
    const type = forecastData.type || 'Forecast';
    const name = forecastData.productName || forecastData.categoryName || forecastData.name || 'Data';
    
    return { type, name };
  };

  // Format data for email payload
  const prepareEmailPayload = () => {
    const { type, name } = getForecastDisplayInfo();
    
    return {
      recipientEmail: email,
      forecastData: forecastData ? {
        type: forecastData.type || 'Forecast',
        name: forecastData.name,
        productName: forecastData.productName,
        categoryName: forecastData.categoryName,
        data: forecastData.forecastData || forecastData.data || [],
        accuracy: forecastData.accuracy
      } : null,
      weatherData: includeWeather && weatherData ? {
        location: weatherData.location || weatherData.city || 'Unknown',
        temperature: weatherData.temperature || weatherData.temp,
        conditions: weatherData.conditions || weatherData.description,
        humidity: weatherData.humidity
      } : null,
      analyticsData: includeAnalytics && analyticsData ? analyticsData : null,
      stockData: includeStock && stockData ? stockData : null,
      subject: customSubject || `${type} for ${name} - Byte Buddies Sales Forecast`,
      additionalMessage: additionalMessage
    };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email validation
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const payload = prepareEmailPayload();
      
      if (!payload.forecastData) {
        throw new Error('No forecast data available to share');
      }

      if (scheduleType === 'now') {
        // Send immediately
        const response = await axios.post(`${config.apiBaseUrl}/api/share/forecast-email`, payload);
        
        if (response.data.success) {
          setShareSuccess(true);
          setEmailSent(true);
          
          // Notify parent component if callback is provided
          if (onNewMessage) {
            onNewMessage(`Shared forecast with ${email}`);
          }
          
          // Show success message
          toast.success('Email sent successfully!', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          
          // Close modal after delay
          setTimeout(() => {
            onHide();
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Failed to send email');
        }
      } else {
        // Schedule the email - response is intentionally not used as we only need to know if it succeeds
        const token = localStorage.getItem('token');
        const schedulePayload = {
          email,
          subject: customSubject || 'Your Sales Forecast',
          message: additionalMessage,
          mode: scheduleType,
          scheduleDateTime: scheduleType === 'once' ? new Date(scheduleDateTime).toISOString() : undefined,
          dailyTime: scheduleType === 'daily' ? dailyTime : undefined,
          templateType: 'forecast',
          payload: payload.forecastData
        };
        await axios.post(`${config.apiBaseUrl}/api/email/schedule`, schedulePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const scheduleText = scheduleType === 'once' ? 'at the specified time' : 'daily';
        toast.success(`Forecast email scheduled to be sent ${scheduleText}!`, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        
        // Close the modal
        onHide();
      }
    } catch (error) {
      console.error('Error sharing forecast:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy forecast data as text
  const handleCopyToClipboard = () => {
    try {
      const { type, name } = getForecastDisplayInfo();
      let clipboardText = `${type} for ${name}\n\n`;
      
      if (forecastData && forecastData.data) {
        forecastData.data.forEach((item, index) => {
          const date = item.date ? new Date(item.date).toLocaleDateString() : 'N/A';
          clipboardText += `Date: ${date}\n`;
          clipboardText += `Forecast: ${item.predictedQuantity || item.quantity || 0} units\n`;
          if (item.revenue) clipboardText += `Revenue: ₹${item.revenue.toFixed(2)}\n`;
          clipboardText += '\n';
        });
      }
      
      clipboardText += '\nGenerated by Byte Buddies Sales Forecasting';
      
      navigator.clipboard.writeText(clipboardText);
      toast.success('Forecast data copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 }}
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 }}
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
      className="share-forecast-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaShare className="me-2" /> Share Forecast Data
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <AnimatePresence mode="wait">
          {shareSuccess ? (
            <motion.div 
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="share-success-icon mb-4"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <FaCheck size={60} className="text-success" />
              </motion.div>
              
              <h3>Sharing Successful!</h3>
              
              {emailSent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-muted mt-3">
                    Your forecast data has been emailed to <strong>{email}</strong>.
                  </p>
                  <p className="mb-4">
                    The recipient will receive the email shortly.
                  </p>
                </motion.div>
              )}
              
              <Button 
                variant="primary" 
                onClick={handleClose} 
                className="mt-2"
                size="lg"
              >
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.p variants={itemVariants} className="lead">
                Share your forecast data and insights via email with colleagues or clients.
              </motion.p>
              
              {errorMessage && (
                <motion.div variants={itemVariants}>
                  <Alert variant="danger" className="mb-4">
                    {errorMessage}
                  </Alert>
                </motion.div>
              )}
              
              <motion.div variants={itemVariants}>
                <div className="card bg-light mb-4">
                  <div className="card-body">
                    <h5 className="card-title">Sharing Preview</h5>
                    <p className="card-text">
                      <strong>Data to be shared:</strong> {getForecastDisplayInfo().type} for {getForecastDisplayInfo().name}
                    </p>
                    <div className="d-flex mb-2">
                      <Form.Check 
                        type="switch"
                        id="include-weather"
                        label="Weather Data"
                        checked={includeWeather}
                        onChange={(e) => setIncludeWeather(e.target.checked)}
                        className="me-3"
                        disabled={!weatherData}
                      />
                      <Form.Check 
                        type="switch"
                        id="include-analytics"
                        label="Analytics"
                        checked={includeAnalytics}
                        onChange={(e) => setIncludeAnalytics(e.target.checked)}
                        className="me-3"
                        disabled={!analyticsData}
                      />
                      <Form.Check 
                        type="switch"
                        id="include-stock"
                        label="Stock Recommendations"
                        checked={includeStock}
                        onChange={(e) => setIncludeStock(e.target.checked)}
                        className="me-3"
                        disabled={!stockData}
                      />
                    </div>
                    <div className="mt-3">
                      <Button variant="outline-secondary" size="sm" onClick={handleCopyToClipboard} className="me-2">
                        <FaRegCopy className="me-1" /> Copy Data
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.form variants={itemVariants} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Recipient Email Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                    <Form.Control
                      type="email"
                      placeholder="Enter recipient's email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="border-0 shadow-sm"
                    />
                    
                    <div className="mt-3">
                      <Form.Label className="d-flex align-items-center text-muted">
                        <FaClock className="me-2" />
                        Schedule
                      </Form.Label>
                      <Form.Select 
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        disabled={loading}
                        className="border-0 shadow-sm"
                      >
                        <option value="now">Send Now</option>
                        <option value="once">Send One-off</option>
                        <option value="daily">Send Daily</option>
                      </Form.Select>
                      {scheduleType === 'once' && (
                        <Form.Control
                          type="datetime-local"
                          value={scheduleDateTime}
                          onChange={(e)=>setScheduleDateTime(e.target.value)}
                          className="border-0 shadow-sm mt-2"
                          required
                          disabled={loading}
                        />
                      )}
                      {scheduleType === 'daily' && (
                        <Form.Control
                          type="time"
                          value={dailyTime}
                          onChange={(e)=>setDailyTime(e.target.value)}
                          className="border-0 shadow-sm mt-2"
                          required
                          disabled={loading}
                        />
                      )}
                      {scheduleType === 'once' && (
                        <Form.Text className="text-muted small">
                          Will be sent at the specified time
                        </Form.Text>
                      )}
                      {scheduleType === 'daily' && (
                        <Form.Text className="text-muted small">
                          Will be sent every day at the specified time
                        </Form.Text>
                      )}
                    </div>
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Subject (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Custom email subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Additional Message (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add a personal message..."
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                
                <motion.div 
                  className="d-grid"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !email}
                    size="lg"
                    className="py-2"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal.Body>
      
      {!shareSuccess && (
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ShareForecastModal;
