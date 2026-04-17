import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaCommentDots, FaTimes, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import AISalesAssistant from './AISalesAssistant';

const AIChatbotFloatingButton = () => {
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  // Check if the user has seen the intro before
  useEffect(() => {
    const introSeen = localStorage.getItem('aiChatIntroSeen');
    if (!introSeen) {
      // Wait 3 seconds before showing the intro message
      const timer = setTimeout(() => {
        setShowIntro(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenIntro(true);
    }
  }, []);
  
  const toggleChat = () => {
    setShowChat(!showChat);
    setShowIntro(false); // Always hide intro when chat is opened
    if (!showChat) {
      setUnreadMessages(0); // Reset unread count when opening
    }
    
    // Mark intro as seen when user interacts with chat
    if (!hasSeenIntro) {
      localStorage.setItem('aiChatIntroSeen', 'true');
      setHasSeenIntro(true);
    }
  };
  
  const dismissIntro = (e) => {
    e.stopPropagation();
    setShowIntro(false);
    localStorage.setItem('aiChatIntroSeen', 'true');
    setHasSeenIntro(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {/* Intro Message Bubble */}
        <AnimatePresence>
          {showIntro && !showChat && (
            <motion.div 
              className="chat-intro bg-light shadow rounded p-3 mb-2 d-flex align-items-start"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              style={{ maxWidth: '280px', position: 'relative' }}
            >
              <div className="text-primary me-2">
                <FaRobot size={24} />
              </div>
              <div className="flex-grow-1">
                <p className="mb-1">Hi there! I'm your AI sales assistant. Ask me about sales data, inventory, or forecasts!</p>
                <small className="text-muted">Click to chat with me</small>
              </div>
              <Button 
                variant="link" 
                className="text-muted p-0 ms-2 position-absolute top-0 end-0" 
                onClick={dismissIntro}
                style={{ fontSize: '1.2rem' }}
              >
                <FaTimes />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Chat Button */}
        <AnimatePresence>
          {!showChat && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleChat}
              className="cursor-pointer"
            >
              <Button
                variant="primary"
                className="rounded-circle p-3 shadow-lg d-flex align-items-center justify-content-center"
                size="lg"
                style={{ width: '60px', height: '60px' }}
              >
                <FaCommentDots size={24} />
                {unreadMessages > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadMessages}
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Modal */}
      <Modal
        show={showChat}
        onHide={toggleChat}
        backdrop="static"
        className="chat-modal"
        centered
        size="lg"
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton className="border-bottom-0 bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaRobot className="me-2" /> AI Sales Assistant
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <AISalesAssistant 
            onNewMessage={() => setUnreadMessages(prev => prev + 1)} 
            onClose={toggleChat}
            hfApiKey={process.env.REACT_APP_HF_API_KEY || ''}
          />
        </Modal.Body>
      </Modal>

      {/* Intro animation when first visiting the site */}
      <AnimatePresence>
        {!showChat && !localStorage.getItem('chatbotIntroShown') && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="position-fixed"
            style={{
              bottom: '100px',
              right: '30px',
              background: 'white',
              padding: '15px',
              borderRadius: '10px',
              maxWidth: '250px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              zIndex: 1049
            }}
          >
            <Button
              variant="link"
              className="position-absolute"
              style={{ top: '5px', right: '5px', padding: '2px' }}
              onClick={() => {
                localStorage.setItem('chatbotIntroShown', 'true');
                document.querySelector('.position-fixed').style.display = 'none';
              }}
            >
              <FaTimes size={14} />
            </Button>
            <p className="mb-2"><strong>Need help?</strong></p>
            <p className="mb-0" style={{ fontSize: '0.9rem' }}>
              I'm your AI Sales Assistant! Ask me anything about your sales, inventory, or how to use this platform.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbotFloatingButton;
