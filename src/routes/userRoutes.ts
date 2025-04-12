import { Router } from 'express';
import { 
  getAvailableGroceries, 
  getOrderHistory 
} from '../controllers/userController';
import { authorize } from '../middleware/authMiddleware';

const router = Router();


router.get('/groceries', getAvailableGroceries);
router.get('/orders/history', authorize(['user']), getOrderHistory);

export default router;