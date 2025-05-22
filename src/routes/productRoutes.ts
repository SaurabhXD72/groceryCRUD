// src/routes/productRoutes.ts
import express from 'express';
import {
  createNewProduct,
  getAllProducts,
  getProduct,
  getMyProducts,
  updateExistingProduct,
  deleteExistingProduct,
  getBrands
} from '../controllers/productController';
import { authenticateJWT, authorizeAdmin } from '../utils/auth';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by admin ID
 *       - in: query
 *         name: adminEmail
 *         schema:
 *           type: string
 *         description: Filter by admin email
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deleted]
 *         description: Filter by product status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /api/products/admin/me:
 *   get:
 *     summary: Get products created by the current admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin's products
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin
 */
router.get('/admin/me', authenticateJWT, authorizeAdmin, getMyProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - brand
 *               - model
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               specifications:
 *                 type: object
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 */
router.post('/', authenticateJWT, authorizeAdmin, createNewProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               specifications:
 *                 type: object
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticateJWT, authorizeAdmin, updateExistingProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticateJWT, authorizeAdmin, deleteExistingProduct);

/**
 * @swagger
 * /api/products/brands:
 *   get:
 *     summary: Get available brands for filtering
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of available brands
 */
router.get('/brands/list', getBrands);

export default router;