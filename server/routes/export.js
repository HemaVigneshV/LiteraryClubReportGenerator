import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { exportDocx, exportPdf } from '../controllers/exportController.js';

const router = Router();

router.get('/:id/docx', authenticateToken, exportDocx);
router.get('/:id/pdf', authenticateToken, exportPdf);

export default router;
