import { Router } from 'express';
import { exportOrders } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken); // Protect report routes

router.get('/export', exportOrders);

export default router;
