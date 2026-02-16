import { Router } from 'express';
import { createOrder, getOrders, getOrderStats, updateOrderStatus, getOrderById, updateOrder } from '../controllers/orderController';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder); // Edit Order Endpoint
router.patch('/:id/status', updateOrderStatus);

export default router;
