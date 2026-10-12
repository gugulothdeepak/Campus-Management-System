import express from 'express';
import { healthCheck, login, getMe, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', healthCheck);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
