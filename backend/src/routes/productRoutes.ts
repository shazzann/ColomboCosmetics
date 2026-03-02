import { Router } from 'express';
import { getProducts, getPopularProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Assuming all product routes are protected
router.use(authenticateToken);

router.get('/popular', getPopularProducts);
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
