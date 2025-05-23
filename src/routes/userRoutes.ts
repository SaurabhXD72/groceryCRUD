// src/routes/userRoutes.ts
import { Router } from 'express';
import { getCurrentUserProfile } from '../controllers/userController';
import { authenticateJWT } from '../utils/auth'; // Assuming this is the correct auth middleware

const router = Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: [] # Assuming JWT bearer token authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO' # Reference your UserDTO schema
 *       401:
 *         description: Not authenticated.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/me', authenticateJWT, getCurrentUserProfile);

export default router;
