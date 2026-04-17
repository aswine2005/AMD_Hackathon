import express from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { 
  addScheduledEmail, 
  updateScheduledEmail, 
  cancelScheduledEmail 
} from '../services/emailScheduler.js';
import ScheduledEmail from '../models/ScheduledEmail.js';

const router = express.Router();

// Middleware to validate user authentication
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // optional user context
    } catch (err) {
      console.warn('Invalid JWT provided – continuing as guest');
    }
  }
  // Always allow request to continue (public endpoint during testing)
  next();
};

// Schedule a new email
router.post('/schedule', [
  authenticateUser,
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().notEmpty(),
  body('message').trim(),
  body('mode').isIn(['once', 'daily']),
  body('scheduleDateTime').if(body('mode').equals('once')).isISO8601(),
  body('dailyTime').if(body('mode').equals('daily')).matches(/^\d{2}:\d{2}$/),
  body('templateType').isIn(['adminData', 'forecast']),
  body('payload').isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, subject, message, mode, scheduleDateTime, dailyTime, templateType, payload } = req.body;
    
    const scheduledEmail = await addScheduledEmail({
      email,
      subject,
      message,
      mode,
      scheduleDateTime,
      dailyTime,
      templateType,
      payload,
      ...(req.user ? { userId: req.user._id } : {})
    });

    res.status(201).json({
      success: true,
      message: 'Email scheduled successfully',
      data: scheduledEmail
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule email',
      error: error.message
    });
  }
});

// Get all scheduled emails for the current user
router.get('/scheduled', authenticateUser, async (req, res) => {
  try {
    const scheduledEmails = await ScheduledEmail.find({
      createdBy: req.user._id,
      isActive: true
    }).sort({ scheduledTime: 1 });

    res.json({
      success: true,
      data: scheduledEmails
    });
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled emails',
      error: error.message
    });
  }
});

// Update a scheduled email
router.put('/schedule/:id', [
  authenticateUser,
  param('id').isMongoId(),
  body('mode').optional().isIn(['once', 'daily']),
  body('scheduleDateTime').optional().isISO8601(),
  body('dailyTime').optional().matches(/^\d{2}:\d{2}$/),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const scheduledEmail = await updateScheduledEmail(id, updateData);

    if (!scheduledEmail) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled email not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheduled email updated successfully',
      data: scheduledEmail
    });
  } catch (error) {
    console.error('Error updating scheduled email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled email',
      error: error.message
    });
  }
});

// Cancel a scheduled email
router.delete('/schedule/:id', [
  authenticateUser,
  param('id').isMongoId()
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const scheduledEmail = await cancelScheduledEmail(id);
    
    if (!scheduledEmail) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled email not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheduled email cancelled successfully',
      data: scheduledEmail
    });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled email',
      error: error.message
    });
  }
});

export default router;
