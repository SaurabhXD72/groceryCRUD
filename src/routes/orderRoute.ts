// src/routes/orderRoutes.ts
import { Router } from 'express';
import { createOrder } from '../controllers/orderController';
import { authorize } from '../middleware/authMiddleware';
const router = Router();

router.post('/', authorize(['user']), createOrder);

export default router;
