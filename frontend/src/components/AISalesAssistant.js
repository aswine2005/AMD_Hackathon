import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Spinner, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaPaperPlane, 
  FaMicrophone, 
  FaVolumeUp, 
  FaDownload, 
  FaTrash, 
  FaMoon, 
  FaSun, 
  FaRobot, 
  FaBrain,
  FaCopy,
  FaPaperclip,
  FaRegSmile,
  FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import './AISalesAssistant.css';
import config from '../config';

const AISalesAssistant = ({ onNewMessage, onClose, hfApiKey }) => {
  // Quick reply suggestions
  const QUICK_REPLIES = [
    'Show me sales trends',
    'What\'s my inventory status?',
    'Generate forecast for next quarter',
    'Top performing products'
  ];
  
  // Chat state
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI Sales Assistant. I can help with sales data, inventory management, and forecasting. What would you like to know?", 
      sender: 'ai', 
      timestamp: new Date().toISOString(),
      quickReplies: [
        'Show sales trends',
        'Inventory status',
        'Generate forecast',
        'Top products'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('aiChatDarkMode') === 'true');
  const [showThinking, setShowThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Speech recognition setup
  const recognition = useRef(null);
  useEffect(() => {
    // Check if browser supports speech recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setErrorMessage('Could not understand audio. Please try again.');
        setTimeout(() => setErrorMessage(''), 3000);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognition.current) {
        try {
          recognition.current.abort();
        } catch (e) {
          console.log('Error aborting speech recognition', e);
        }
      }
    };
  }, []);
  
  // Save to local storage whenever messages update
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Load chat history from local storage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setMessages(parsedHistory);
        }
      } catch (error) {
        console.error('Error parsing chat history', error);
      }
    }
  }, []);
  
  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('aiChatDarkMode', darkMode);
  }, [darkMode]);
  
  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Handle speech recognition toggle
  const toggleListening = () => {
    if (isListening) {
      if (recognition.current) {
        try {
          recognition.current.abort();
        } catch (e) {
          console.log('Error aborting speech recognition', e);
        }
      }
      setIsListening(false);
    } else {
      if (recognition.current) {
        setIsListening(true);
        try {
          recognition.current.start();
        } catch (error) {
          console.error('Speech recognition error', error);
          setIsListening(false);
        }
      } else {
        setErrorMessage('Speech recognition not supported in this browser');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };
  
  // Handle text-to-speech
  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      
      if (synth.speaking) {
        synth.cancel();
        setIsSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      // Find a good voice
      setTimeout(() => {
        const voices = synth.getVoices();
        const englishVoice = voices.find(voice => voice.lang.includes('en') && voice.name.includes('Female'));
        if (englishVoice) utterance.voice = englishVoice;
        
        setIsSpeaking(true);
        synth.speak(utterance);
      }, 100);
    } else {
      setErrorMessage('Text-to-speech not supported in this browser');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  
  // Clear chat history
  const clearChat = () => {
    const initialMessage = {
      id: Date.now(),
      text: "Hello! I'm your AI Sales Assistant. I can help with sales data, inventory management, and forecasting. What can I assist you with today?",
      sender: 'ai',
      timestamp: new Date().toISOString()
    };
    setMessages([initialMessage]);
    localStorage.removeItem('chatHistory');
  };
  
  // Download chat history
  const downloadChat = () => {
    const chatText = messages.map(msg => `${msg.sender === 'user' ? 'You' : 'AI'} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowThinking(true);
    
    // Format chat history for context
    const chatHistory = messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
      .slice(-6) // Keep last 6 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
    
    try {
      // Call the backend AI endpoint
      const response = await axios.post(
        `${config.apiBaseUrl}/api/ai/chat`, 
        {
          message: userMessage.text,
          history: chatHistory
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );
      
      // Handle the response from our new backend service
      const aiResponse = {
        id: Date.now() + 1,
        text: response.data.text || "I'm not sure how to respond to that. Could you rephrase your question?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        metadata: response.data.metadata || {}
      };
      
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      
      // If there's a new message and the callback exists, trigger it
      if (onNewMessage) onNewMessage();
      
      // Check for navigation intents in the message
      checkForNavigationIntent(aiResponse.text);
      
    } catch (error) {
      console.error('Error with AI service:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to the AI service. Please try again later.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Log the full error for debugging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    } finally {
      setIsLoading(false);
      setShowThinking(false);
    }
  };
  
  // Check for navigation intents in AI responses
  const checkForNavigationIntent = (text) => {
    const navigationKeywords = {
      'dashboard': '/',
      'home page': '/',
      'go to dashboard': '/',
      'sales data': '/sales-data',
      'forecast': '/forecast',
      'go to forecast': '/forecast',
      'products': '/products',
      'product list': '/products',
      'categories': '/categories',
      'rankings': '/rankings',
      'performance ranking': '/rankings',
      'category management': '/category-management'
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [keyword, path] of Object.entries(navigationKeywords)) {
      if (lowerText.includes(`navigate to ${keyword}`) || 
          lowerText.includes(`go to ${keyword}`) || 
          lowerText.includes(`open ${keyword}`) ||
          lowerText.includes(`show me ${keyword}`)) {
        // Wait a moment before navigating to allow user to read the response
        setTimeout(() => {
          navigate(path);
          if (onClose) onClose(); // Close the chat modal when navigating
        }, 1500);
        return;
      }
    }
  };

  // Format message text with markdown support
  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Simple markdown to HTML conversion
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')               // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>')             // `code`
      .replace(/\n/g, '<br/>')                            // New lines
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); // Links
  };

  // Render a message with enhanced formatting
  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    const timeAgo = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`message-container ${isUser ? 'user-container' : 'ai-container'}`}
      >
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          <div 
            className="message-content" 
            dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }} 
          />
          
          {/* Quick replies for AI messages */}
          {!isUser && message.quickReplies && (
            <div className="quick-replies mt-2 d-flex flex-wrap gap-2">
              {message.quickReplies.map((reply, idx) => (
                <Button
                  key={idx}
                  variant="outline-primary"
                  size="sm"
                  className="rounded-pill"
                  onClick={() => {
                    setInput(reply);
                    // Auto-send if it's a short reply
                    if (reply.length < 30) {
                      handleSendMessage({ preventDefault: () => {} }, reply);
                    }
                  }}
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}
          
          <div className="message-footer d-flex justify-content-between align-items-center mt-2">
            <small className="message-time text-muted">
              {timeAgo}
            </small>
            
            <div className="message-actions">
              {isUser ? (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 ms-2 text-muted"
                  onClick={() => navigator.clipboard.writeText(message.text)}
                >
                  <FaCopy />
                </Button>
              ) : (
                <Button 
                  variant="link" 
                  size="sm" 
                  className={`p-0 ms-2 ${isSpeaking ? 'text-primary' : 'text-muted'}`}
                  onClick={() => speakMessage(message.text)}
                >
                  <FaVolumeUp />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className={`chat-container border-0 ${darkMode ? 'dark-mode' : ''}`}>
      {/* Chat options */}
      <div className="chat-options py-2 border-bottom">
        <Button 
          variant={darkMode ? "light" : "dark"} 
          size="sm" 
          className="rounded-circle p-1" 
          onClick={toggleDarkMode}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </Button>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="ms-2" 
          onClick={downloadChat}
        >
          <FaDownload className="me-1" /> Save Chat
        </Button>
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-2" 
          onClick={clearChat}
        >
          <FaTrash className="me-1" /> Clear Chat
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map(message => renderMessage(message))}
        
        {/* Thinking animation */}
        <AnimatePresence>
          {showThinking && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="brain-container"
            >
              <FaBrain size={32} className="thinking-brain" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && !showThinking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="typing-indicator"
            >
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Alert variant="danger" className="mt-2 mb-0 py-2">
                {errorMessage}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick reply suggestions */}
      {!input && messages.length > 0 && (
        <div className="quick-reply-suggestions p-2 border-top">
          <div className="d-flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply, idx) => (
              <Button
                key={idx}
                variant="outline-primary"
                size="sm"
                className="rounded-pill"
                onClick={() => setInput(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="chat-input p-2 border-top">
        <Form onSubmit={handleSendMessage} className="position-relative">
          <div className="d-flex align-items-end">
            <Button
              variant="link"
              className="text-muted p-2"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={isLoading}
            >
              <FaPaperclip size={20} />
            </Button>
            <input
              type="file"
              id="file-upload"
              className="d-none"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  console.log('File selected:', file);
                  // Handle file upload here
                }
              }}
            />
            
            <Form.Control
              as="textarea"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-grow-1 mx-2"
              style={{
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '10px 15px',
                borderRadius: '24px',
                border: '1px solid #dee2e6'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSendMessage(e);
                  }
                }
              }}
            />
            
            <Button
              variant={isListening ? 'danger' : 'outline-secondary'}
              className="me-2 rounded-circle"
              onClick={toggleListening}
              disabled={(!window.SpeechRecognition && !window.webkitSpeechRecognition) || isLoading}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px'
              }}
            >
              <FaMicrophone className={isListening ? 'pulse' : ''} />
            </Button>
            
            <Button
              variant="primary"
              className="rounded-circle"
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPaperPlane />
              )}
            </Button>
          </div>
          
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted ms-2">
              {input.length > 0 && (
                <span>{input.length} / 1000</span>
              )}
            </small>
            
            <Button
              variant="link"
              size="sm"
              className="text-muted p-0 me-2"
              onClick={() => {
                // Toggle emoji picker (to be implemented)
              }}
              disabled={isLoading}
            >
              <FaRegSmile size={20} />
            </Button>
          </div>
        </Form>
      </div>
    </Card>
  );
};

export default AISalesAssistant;
