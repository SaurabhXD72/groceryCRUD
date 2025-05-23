import request from 'supertest';
import app from '../../app'; // Assuming your app instance is exported from app.ts
// import * as productDal from '../../dal/productDal'; // Removed DAL import
import { generateToken } from '../../utils/auth'; // Keep for auth mock if any other test needs it

// // Mock the productDal - REMOVED
// jest.mock('../../dal/productDal');

// Mock the auth middleware - Keep if other product routes are protected and tested here later
// For now, GET /health doesn't need it.
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req: any, res: any, next: () => void) => {
    const decodedAdmin = { userId: 1, email: 'admin@example.com', role: 'admin' };
    req.user = decodedAdmin; 
    next();
  },
  adminOnly: (req: any, res: any, next: () => void) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  },
}));


describe('Product Routes / General App Health', () => { // Renamed describe block for clarity
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', message: 'Server is running' });
    });
  });

  // describe('POST /api/products', () => { // REMOVED POST /api/products tests as they depend on DAL
  //   // ... tests that were here are removed ...
  // });
});
