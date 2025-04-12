import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', (req, res) => {
    register(req, res).catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    });
});

router.post('/login', (req, res) => {
    login(req, res).catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    });
});

export default router;