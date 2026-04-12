import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getAllReports, getReport, createReport, updateReport,
  submitReport, approveReport, rejectReport, deleteReport,
  generateShareCode, revokeShareCode,
  getReportByShareCode, updateReportByShareCode,
  uploadReportDocument
} from '../controllers/reportController.js';

const router = Router();

const reportUpload = upload.fields([
  { name: 'circularImage', maxCount: 1 },
  { name: 'posterImage', maxCount: 1 },
  { name: 'registrationImages', maxCount: 10 },
  { name: 'eventImages', maxCount: 10 }
]);

router.get('/', authenticateToken, getAllReports);
router.get('/:id', authenticateToken, getReport);
router.post('/', authenticateToken, reportUpload, createReport);
router.post('/upload-document', authenticateToken, upload.single('uploadedWordFile'), uploadReportDocument);
router.put('/:id', authenticateToken, reportUpload, updateReport);
router.put('/:id/submit', authenticateToken, submitReport);
router.put('/:id/approve', authenticateToken, requireAdmin, approveReport);
router.put('/:id/reject', authenticateToken, requireAdmin, rejectReport);
router.delete('/:id', authenticateToken, requireAdmin, deleteReport);

// Share code endpoints
router.post('/:id/share', authenticateToken, generateShareCode);
router.delete('/:id/share', authenticateToken, revokeShareCode);

// Public share access (no auth)
router.get('/share/:code', getReportByShareCode);
router.put('/share/:code', reportUpload, updateReportByShareCode);

export default router;
