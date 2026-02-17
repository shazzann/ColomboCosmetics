"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get('/dashboard', dashboardController_1.getDashboardStats);
router.post('/', orderController_1.createOrder);
router.get('/', orderController_1.getOrders);
router.get('/stats', orderController_1.getOrderStats);
router.get('/:id', orderController_1.getOrderById);
router.put('/:id', orderController_1.updateOrder); // Edit Order Endpoint
router.patch('/:id/status', orderController_1.updateOrderStatus);
router.delete('/:id', (0, authMiddleware_1.authorizeRole)(['ADMIN']), orderController_1.deleteOrder);
exports.default = router;
