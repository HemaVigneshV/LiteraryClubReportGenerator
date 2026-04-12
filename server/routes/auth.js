import { Router } from 'express';
import { login, register, getMe, getCoordinators, getAllUsers, deleteUser } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, requireAdmin, register);
router.get('/me', authenticateToken, getMe);
router.get('/coordinators', authenticateToken, requireAdmin, getCoordinators);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
