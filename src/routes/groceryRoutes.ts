import { Router } from "express"; // doubt #1 why do we wrap everything in curly braces? what does it signifies? 
import { addGroceryItems ,
    updateGroceryItems ,
    manageInventoryItems ,
    deleteGroceryItems
} from '../controllers/groceryController';
import { authorize } from "../middleware/authMiddleware";

// import { authorize } from  
const router = Router();
router.post('/', authorize(['admin']), addGroceryItems);
router.patch('/:id', authorize(['admin']), updateGroceryItems);
router.patch('/:id/inventory', authorize(['admin']), manageInventoryItems);
router.delete('/:id', authorize(['admin']), deleteGroceryItems);

export default router;