import express from 'express';
import {
  getAssignedClassesAndSubjects,
  getStudentsByClass,
  getAttendanceSession,
  saveAttendance,
  getAttendanceHistory,
  saveStudentMarks,
  updateAttendanceLog,
  deleteAttendanceLog,
} from '../controllers/facultyController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate, requireRoles('FACULTY', 'ADMIN'));

router.get('/assigned', getAssignedClassesAndSubjects);
router.get('/students', getStudentsByClass);
router.get('/attendance', getAttendanceSession);
router.post('/attendance', saveAttendance);
router.put('/attendance/:id', updateAttendanceLog);
router.delete('/attendance/:id', deleteAttendanceLog);
router.get('/attendance-history', getAttendanceHistory);
router.post('/marks', saveStudentMarks);

export default router;
