import express from 'express';
import { getStudentDashboard } from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate, requireRoles('STUDENT', 'ADMIN'));

router.get('/dashboard', getStudentDashboard);

export default router;
