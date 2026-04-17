import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup, Badge } from 'react-bootstrap';
import { 
  FaEnvelope, FaCheck, FaPaperPlane, FaRegCopy, FaChartLine, 
  FaBoxes, FaMoneyBillWave, FaPiggyBank, FaShoppingCart, FaStoreAlt,
  FaCalendarAlt, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';
import '../animations.css';

/**
 * ShareAdminDataModal - Component for sharing today's sales and business data via email
 */
// Added optional onNewMessage callback (default: noop) to avoid ReferenceError
const ShareAdminDataModal = ({ show, onHide, adminData, onNewMessage = () => {} }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [scheduleType, setScheduleType] = useState('now'); // 'now', 'once', 'daily'
  const [scheduleDateTime, setScheduleDateTime] = useState(''); // for one-off
  const [dailyTime, setDailyTime] = useState(''); // for daily

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  const successVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 10 }
    }
  };

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
    setCustomSubject('');
  };

  // Handle modal close
  const handleClose = () => {
    onHide();
  };

  // Format data for email payload
  const prepareEmailPayload = () => {
    const todayDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return {
      recipientEmail: email,
      adminData: adminData || {},
      subject: customSubject || `Today's Sales Report (${todayDate}) - Byte Buddies Sales Analysis`,
      additionalMessage: additionalMessage,
      type: 'admin' // Specify this is admin data not forecast data
    };
  };

  // Send email
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
      
      if (!payload.adminData) {
        throw new Error('No sales data available to share');
      }

      if (scheduleType === 'now') {
        // Send immediately
        const response = await axios.post(`${config.apiBaseUrl}/api/share/admin-email`, payload);

        if (response.data.success) {
          setShareSuccess(true);
          setEmailSent(true);
          
          // Notify parent component if callback is provided
          try {
            onNewMessage(`Shared admin data with ${email}`);
          } catch (err) {
            // silent fail if consumer did not supply callback
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
        } else {
          throw new Error(response.data.message || 'Failed to send email');
        }
      } else {
        // Schedule the email
        const token = localStorage.getItem('token');
        const schedulePayload = {
          email,
          subject: customSubject || 'Your Sales Report',
          message: additionalMessage,
          mode: scheduleType,
          scheduleDateTime: scheduleType === 'once' ? new Date(scheduleDateTime).toISOString() : undefined,
          dailyTime: scheduleType === 'daily' ? dailyTime : undefined,
          templateType: 'adminData',
          payload: payload.adminData
        };
        const response = await axios.post(`${config.apiBaseUrl}/api/email/schedule`, schedulePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const scheduleText = scheduleType === 'once' ? 'at the specified time' : 'daily';
        
        toast.success(`Email scheduled to be sent ${scheduleText}!`, {
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
        return;
      }
      
      // Close modal after delay (only for immediate sends)
      setTimeout(() => {
        onHide();
      }, 2000);
      
    } catch (error) {
      console.error('Error sharing admin data:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy admin data as text
  const handleCopyToClipboard = () => {
    if (!adminData) {
      toast.error('No data available to copy');
      return;
    }
    
    try {
      const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      let textContent = `TODAY'S SALES REPORT - ${today}\n\n`;
      textContent += `Total Sales: ${adminData.totalSales} units\n`;
      textContent += `Total Revenue: ₹${adminData.totalRevenue.toLocaleString('en-IN')}\n`;
      textContent += `Total Profit: ₹${adminData.totalProfit.toLocaleString('en-IN')}\n`;
      textContent += `Total Orders: ${adminData.orders}\n\n`;
      
      if (adminData.topProducts && adminData.topProducts.length > 0) {
        textContent += `TOP SELLING PRODUCTS:\n`;
        adminData.topProducts.forEach((product, index) => {
          textContent += `${index + 1}. ${product.name}: ${product.quantity} units (₹${product.revenue.toLocaleString('en-IN')})\n`;
        });
        textContent += '\n';
      }
      
      if (adminData.topCategories && adminData.topCategories.length > 0) {
        textContent += `TOP SELLING CATEGORIES:\n`;
        adminData.topCategories.forEach((category, index) => {
          textContent += `${index + 1}. ${category.name}: ${category.quantity} units (₹${category.revenue.toLocaleString('en-IN')})\n`;
        });
      }
      
      navigator.clipboard.writeText(textContent);
      toast.success('Report copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy data to clipboard');
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
      className="enhanced-modal share-modal"
    >
      <Modal.Header closeButton={!loading} className="border-0 pb-0">
        <Modal.Title className="w-100 text-center">
          {shareSuccess ? (
            <div className="d-flex align-items-center justify-content-center">
              <span className="bg-success text-white p-2 rounded-circle me-2">
                <FaCheck />
              </span>
              <span className="fw-bold">Report Shared Successfully!</span>
            </div>
          ) : (
            <div className="modal-title-container">
              <h4 className="fw-bold mb-0">
                <FaEnvelope className="me-2 text-primary" /> Share Today's Sales Report
              </h4>
              <p className="text-muted small mt-2">Send the latest sales metrics to your team or stakeholders</p>
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="py-4 px-4">
        <AnimatePresence mode="wait">
          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
              {errorMessage}
            </Alert>
          )}
          
          {shareSuccess ? (
            <motion.div
              variants={successVariants}
              initial="hidden"
              animate="visible"
              className="text-center py-5"
            >
              <div className="success-icon mb-4">
                <div className="success-circle pulse mx-auto" style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#28a745', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <FaCheck className="text-white" size={36} />
                </div>
              </div>
              <h3 className="fw-bold mb-3">Today's Sales Report Shared!</h3>
              <p className="mb-4 text-muted">
                The report has been successfully sent to <span className="text-primary fw-bold">{email}</span>
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="outline-secondary" 
                  onClick={resetForm}
                  className="enhanced-button"
                >
                  <FaEnvelope className="me-2" /> Send Another
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleClose}
                  className="enhanced-button button-hover-effect"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="mb-4">
                <div className="share-preview rounded-3 bg-light p-4 border-0 mb-4 position-relative overflow-hidden" 
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                >
                  <div className="preview-background-shape" style={{ 
                    position: 'absolute', 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    background: 'rgba(13, 110, 253, 0.05)', 
                    top: '-50px', 
                    right: '-50px', 
                    zIndex: 0 
                  }}></div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <span className="bg-primary text-white p-2 rounded-circle me-2">
                      <FaChartLine size={16} />
                    </span>
                    Report Preview
                  </h5>
                  <div className="preview-content">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="stat-item p-3 mb-2 bg-white rounded-3 shadow-sm">
                          <div className="small text-muted mb-1">Total Sales</div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="stat-value fw-bold">{adminData?.totalSales || 0} units</span>
                            <span className="stat-icon"><FaBoxes className="text-primary" /></span>
                          </div>
                        </div>
                        <div className="stat-item p-3 mb-2 bg-white rounded-3 shadow-sm">
                          <div className="small text-muted mb-1">Total Revenue</div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="stat-value fw-bold">₹{adminData?.totalRevenue?.toLocaleString('en-IN') || '0'}</span>
                            <span className="stat-icon"><FaMoneyBillWave className="text-success" /></span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="stat-item p-3 mb-2 bg-white rounded-3 shadow-sm">
                          <div className="small text-muted mb-1">Total Profit</div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="stat-value fw-bold">₹{adminData?.totalProfit?.toLocaleString('en-IN') || '0'}</span>
                            <span className="stat-icon"><FaPiggyBank className="text-danger" /></span>
                          </div>
                        </div>
                        <div className="stat-item p-3 mb-2 bg-white rounded-3 shadow-sm">
                          <div className="small text-muted mb-1">Total Orders</div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="stat-value fw-bold">{adminData?.orders || 0}</span>
                            <span className="stat-icon"><FaShoppingCart className="text-warning" /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {adminData?.topProducts && adminData.topProducts.length > 0 && (
                      <div className="top-products-preview mt-3 p-3 bg-white rounded-3 shadow-sm">
                        <p className="preview-section-title fw-bold mb-2">Top Products:</p>
                        <ul className="preview-list list-unstyled mb-0">
                          {adminData.topProducts.map((p, idx) => (
                            <li key={p.name || idx} className="d-flex justify-content-between align-items-center">
                              <span>{p.name} - ₹{p.sales?.toFixed(2)}</span>
                              {p.quantity !== undefined && (
                                <span className="badge bg-light text-dark ms-2">{p.quantity} units</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline-primary"
                    className="enhanced-button mt-3 w-100 d-flex align-items-center justify-content-center"
                    onClick={handleCopyToClipboard}
                  >
                    <FaRegCopy className="me-2" /> Copy Full Report
                  </Button>
                </div>
              </motion.div>
              
              <motion.form variants={itemVariants} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Recipient Email Address</Form.Label>
                  <InputGroup className="mb-2">
                    <InputGroup.Text className="bg-light"><FaEnvelope /></InputGroup.Text>
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
                    </div>
                  </InputGroup>
                  <div className="text-muted small">Enter the email address where you want to send this report</div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email Subject (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Custom email subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    disabled={loading}
                    className="enhanced-input"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Additional Message (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add a personal message..."
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                    disabled={loading}
                    className="enhanced-input"
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
                    className="enhanced-button py-3"
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
        <Modal.Footer className="border-0 pt-0">
          <Button variant="link" onClick={handleClose} disabled={loading} className="text-muted">
            Cancel
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ShareAdminDataModal;
