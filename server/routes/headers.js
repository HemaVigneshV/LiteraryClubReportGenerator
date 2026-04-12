import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { listHeaders, uploadHeader } from '../controllers/headerController.js';

const router = Router();

// Anyone authenticated can list headers
router.get('/', authenticateToken, listHeaders);

// Anyone authenticated can upload a new header
router.post('/upload', authenticateToken, upload.single('headerFile'), uploadHeader);

export default router;
