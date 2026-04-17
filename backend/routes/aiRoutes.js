import express from 'express';
import { check, validationResult } from 'express-validator';
import { getAIResponse } from '../services/aiService.js';

const router = express.Router();

/**
 * @route   POST api/ai/chat
 * @desc    Process user queries using OpenAI and return AI responses
 * @access  Private
 */
router.post('/chat', [
  check('message', 'Message is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message, history = [] } = req.body;
    
    // Get AI response using OpenAI
    const aiResponse = await getAIResponse(message, history);
    
    // Prepare response
    const response = {
      text: aiResponse.text,
      metadata: aiResponse.metadata
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({
      error: 'Failed to process your request',
      details: error.message
    });
  }
});

export default router;
