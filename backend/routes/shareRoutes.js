import express from 'express';
import shareController from '../controllers/shareController.js';

const router = express.Router();

/**
 * @route   POST /api/share/email
 * @desc    Send forecast data via email
 * @access  Public
 */
router.post('/email', shareController.sendEmailShare);

/**
 * @route   POST /api/share/admin-email
 * @desc    Send admin dashboard data via email
 * @access  Public
 */
router.post('/admin-email', shareController.sendAdminEmail);

export default router;
