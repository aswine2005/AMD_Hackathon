import cron from 'node-cron';
import ScheduledEmail from '../models/ScheduledEmail.js';
import { sendAdminDataEmail, sendForecastEmail } from './emailService.js';

// Store active timers
const activeTimers = new Map();

// Calculate next run based on ScheduledEmail document (mode, scheduleDateTime, dailyTime)
const calculateNextRun = (emailDoc, baseDate = new Date()) => {
  const date = new Date(baseDate);
  
  const { mode, scheduleDateTime, dailyTime } = emailDoc;
  if (mode === 'once') {
    return new Date(scheduleDateTime);
  }
  // daily
  const [hh, mm] = dailyTime.split(':').map(Number);
  const next = new Date(baseDate);
  next.setHours(hh, mm, 0, 0);
  // if time already passed today, set for tomorrow
  if (next <= baseDate) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

// Process a single scheduled email
const processScheduledEmail = async (scheduledEmail) => {
  try {
    const { templateType, payload, email, subject, message } = scheduledEmail;
    
    // Send the appropriate email based on template type
    if (templateType === 'adminData') {
      // Always compute fresh summary for today instead of using stored payload
      const { getTodayAdminSummary } = await import('./adminSummaryService.js');
      const adminDataFresh = await getTodayAdminSummary();
      await sendAdminDataEmail({
        to: email,
        subject: subject || 'Your Daily Sales Report',
        message: message,
        adminData: adminDataFresh
      });
    } else if (templateType === 'forecast') {
      await sendForecastEmail({
        to: email,
        subject: subject || 'Your Sales Forecast',
        message: message,
        forecastData: payload
      });
    }
    
    // Update last sent time
    scheduledEmail.lastSent = new Date();
    
    // If it's a one-time schedule, deactivate it
    if (scheduledEmail.mode === 'once') {
      scheduledEmail.isActive = false;
    }
    
    await scheduledEmail.save();
    
    // If it's a daily schedule, schedule the next run
    if (scheduledEmail.mode === 'daily' && scheduledEmail.isActive) {
      scheduleEmail(scheduledEmail);
    }
    
    console.log(`Sent scheduled email to ${email} (${templateType})`);
  } catch (error) {
    console.error('Error processing scheduled email:', error);
    // You might want to implement retry logic here
  }
};

// Schedule a single email
const scheduleEmail = (scheduledEmail) => {
  const { _id } = scheduledEmail;
  const scheduledTime = calculateNextRun(scheduledEmail);
  
  // Clear any existing timer for this email
  if (activeTimers.has(_id.toString())) {
    clearTimeout(activeTimers.get(_id.toString()));
    activeTimers.delete(_id.toString());
  }
  
  // Calculate time until next run
  const now = new Date();
  const timeUntilNextRun = scheduledTime.getTime() - now.getTime();
  
  // Only schedule if the time is in the future
  if (timeUntilNextRun > 0) {
    const timer = setTimeout(() => {
      processScheduledEmail(scheduledEmail);
    }, timeUntilNextRun);
    
    activeTimers.set(_id.toString(), timer);
    console.log(`Scheduled email ${_id} to run at ${scheduledTime}`);
  } else {
    console.log(`Skipping expired schedule for email ${_id}`);
  }
};

// Initialize the email scheduler
const initScheduler = async () => {
  try {
    // Load all active scheduled emails from the database
    const activeEmails = await ScheduledEmail.find({ isActive: true });
    
    // Schedule each active email
    for (const email of activeEmails) {
      scheduleEmail(email);
    }
    
    console.log(`Initialized email scheduler with ${activeEmails.length} active schedules`);
  } catch (error) {
    console.error('Error initializing email scheduler:', error);
  }
};

// Add a new scheduled email
const addScheduledEmail = async (emailData) => {
  try {
    const scheduledTime = calculateNextRun(emailData);
    
    const scheduledEmail = new ScheduledEmail({
      ...emailData,
      scheduledTime,
      isActive: true
    });
    
    await scheduledEmail.save();
    
    // Schedule the email
    scheduleEmail(scheduledEmail);
    
    return scheduledEmail;
  } catch (error) {
    console.error('Error adding scheduled email:', error);
    throw error;
  }
};

// Update an existing scheduled email
const updateScheduledEmail = async (id, updateData) => {
  try {
    const scheduledEmail = await ScheduledEmail.findById(id);
    if (!scheduledEmail) {
      throw new Error('Scheduled email not found');
    }
    
    // Update fields
    Object.assign(scheduledEmail, updateData);
    
        // Recalculate next run time
    scheduledEmail.scheduledTime = calculateNextRun(scheduledEmail);
    
    await scheduledEmail.save();
    
    // Reschedule if active
    if (scheduledEmail.isActive) {
      scheduleEmail(scheduledEmail);
    }
    
    return scheduledEmail;
  } catch (error) {
    console.error('Error updating scheduled email:', error);
    throw error;
  }
};

// Cancel a scheduled email
const cancelScheduledEmail = async (id) => {
  try {
    const scheduledEmail = await ScheduledEmail.findById(id);
    if (!scheduledEmail) {
      throw new Error('Scheduled email not found');
    }
    
    // Clear the timer if it exists
    if (activeTimers.has(id)) {
      clearTimeout(activeTimers.get(id));
      activeTimers.delete(id);
    }
    
    // Mark as inactive
    scheduledEmail.isActive = false;
    await scheduledEmail.save();
    
    return scheduledEmail;
  } catch (error) {
    console.error('Error canceling scheduled email:', error);
    throw error;
  }
};

export {
  initScheduler,
  addScheduledEmail,
  updateScheduledEmail,
  cancelScheduledEmail,
  calculateNextRun
};
