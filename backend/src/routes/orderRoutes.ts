import { Router } from 'express';
import { createOrder, getOrders, getOrderStats, updateOrderStatus, getOrderById } from '../controllers/orderController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
