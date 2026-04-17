import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// Ensure environment variables are loaded even if this module is imported before server.js
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
import { addScheduledEmail } from './emailScheduler.js';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate HTML template for admin data email
const generateAdminDataEmail = ({ adminData, subject = 'Sales Report', message = '' }) => {
  const formatINR = (num = 0) => `₹${Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Build rows
  const productRows = (adminData.products || [])
    .map(p => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${p.name}</td><td style="text-align:center;padding:8px;border-bottom:1px solid #eee;">${p.quantity}</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee;">${formatINR(p.revenue)}</td></tr>`)
    .join('');

  const categoryRows = (adminData.categories || [])
    .map(c => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${c.name}</td><td style="text-align:center;padding:8px;border-bottom:1px solid #eee;">${c.quantity}</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee;">${formatINR(c.revenue)}</td></tr>`)
    .join('');

  const unsoldCats = (adminData.notSellingCategories || []).join(', ') || 'None';
  const unsoldProds = (adminData.notSellingProducts || []).join(', ') || 'None';

  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <h2 style="text-align:center">${subject}</h2>
      ${message ? `<p>${message.replace(/\n/g,'<br>')}</p>` : ''}

      <h3>Today's Sales Summary</h3>
      <table style="width:100%;border-collapse:collapse;margin:15px 0;">
        <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Metric</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ddd;">Value</th></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">Total Orders</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee;">${adminData.totalOrders}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">Total Revenue</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee;">${formatINR(adminData.totalSales)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">Average Order Value</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee;">${formatINR(adminData.aov)}</td></tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Metric</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Value</th>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Total Sales</td>
          <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">₹${(adminData.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Total Orders</td>
          <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${adminData.totalOrders || 0}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Average Order Value</td>
          <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">₹${(adminData.aov || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </table>
      
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
};

// Generate HTML template for forecast email
const generateForecastEmail = (data) => {
  const { forecastData, subject = 'Sales Forecast', message = '' } = data;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      ${message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : ''}
      
      <h3>Sales Forecast</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Date</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Forecasted Sales</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Confidence</th>
        </tr>
        ${forecastData.predictions?.map(prediction => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(prediction.date).toLocaleDateString()}</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">₹${(prediction.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${(prediction.confidence * 100)?.toFixed(1) || '0'}%</td>
          </tr>
        `).join('')}
      </table>
      
      <p>This is an automated forecast. Please review the data and make adjustments as needed.</p>
      <hr>
      <p style=\"font-size:12px;text-align:center;color:#888;\">Powered by Byte Buddies &middot; This is an automated message</p>
    </div>
  `;
};

// Send admin data email
const sendAdminDataEmail = async ({ to, subject, message, adminData, scheduleType = null, userId = null }) => {
  if (scheduleType) {
    // Schedule the email instead of sending immediately
    return await addScheduledEmail({
      email: to,
      subject,
      message,
      scheduleType,
      templateType: 'adminData',
      payload: adminData,
      createdBy: userId
    });
  }
  
  // Send immediately
  const mailOptions = {
    from: `"Sales Forecasting App" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || 'Your Sales Report',
    html: generateAdminDataEmail({ adminData, subject, message })
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send forecast email
const sendForecastEmail = async ({ to, subject, message, forecastData, scheduleType = null, userId = null }) => {
  if (scheduleType) {
    // Schedule the email instead of sending immediately
    return await addScheduledEmail({
      email: to,
      subject,
      message,
      scheduleType,
      templateType: 'forecast',
      payload: forecastData,
      createdBy: userId
    });
  }
  
  // Send immediately
  const mailOptions = {
    from: `"Sales Forecasting App" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || 'Your Sales Forecast',
    html: generateForecastEmail({ forecastData, subject, message })
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export {
  sendAdminDataEmail,
  sendForecastEmail,
  generateAdminDataEmail,
  generateForecastEmail
};
