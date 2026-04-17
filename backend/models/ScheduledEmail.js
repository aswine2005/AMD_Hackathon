import mongoose from 'mongoose';

const scheduledEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    enum: ['once', 'daily'],
    required: true,
    default: 'once'
  },
  // For one-off schedules
  scheduleDateTime: {
    type: Date
  },
  // For daily recurring schedules – store time of day in HH:mm format (24h)
  dailyTime: {
    type: String,
    match: /^\d{2}:\d{2}$/
  },
  lastSent: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  payload: {
    type: Object,
    required: true
  },
  templateType: {
    type: String,
    enum: ['adminData', 'forecast'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ScheduledEmail = mongoose.model('ScheduledEmail', scheduledEmailSchema);

export default ScheduledEmail;
