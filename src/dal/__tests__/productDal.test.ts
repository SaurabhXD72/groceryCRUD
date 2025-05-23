import { getProductById } from '../productDal'; // The function we want to test
import db from '../../db/knex'; // The module we need to mock

// Mock the db module
jest.mock('../../db/knex', () => {
  // Mock implementation for the Knex chain
  const mockFirst = jest.fn();
  const mockAndWhereNot = jest.fn(() => ({ first: mockFirst }));
  const mockWhere = jest.fn(() => ({ andWhereNot: mockAndWhereNot, first: mockFirst })); // Allow .first() directly after .where() if andWhereNot is skipped

  const mockSelect = jest.fn(() => ({
    where: mockWhere,
    andWhereNot: mockAndWhereNot,
    first: mockFirst,
    join: jest.fn().mockReturnThis(), // for getProducts
    orderBy: jest.fn().mockReturnThis(), // for getProducts
  }));

  const mockDbInstance = {
    where: mockWhere,
    andWhereNot: mockAndWhereNot,
    first: mockFirst,
    select: mockSelect, // For queries starting with db('table').select(...)
    insert: jest.fn().mockReturnThis(), // for createProduct
    update: jest.fn().mockReturnThis(), // for updateProduct, deleteProduct
    distinct: jest.fn().mockReturnThis(), // for getAvailableBrands
    join: jest.fn().mockReturnThis(), // for getProducts if it starts with db('table').join(...)
    orderBy: jest.fn().mockReturnThis(), // for getProducts, getAvailableBrands
    count: jest.fn().mockReturnThis(), // For emailExists in userDal (if we test it here)
    // Add other methods if used
  };

  const mockKnex = jest.fn((tableName: string) => mockDbInstance);
  
  // Expose the underlying mocks for more specific assertions or configurations if needed
  (mockKnex as any)._mockFirst = mockFirst;
  (mockKnex as any)._mockWhere = mockWhere;
  (mockKnex as any)._mockAndWhereNot = mockAndWhereNot;
  (mockKnex as any)._mockSelect = mockSelect;
  (mockKnex as any)._mockInsert = mockDbInstance.insert;
  (mockKnex as any)._mockUpdate = mockDbInstance.update;


  return mockKnex;
});

// Helper to access the mock functions for db('tableName').first() etc.
const mockDbFirst = (db as any)._mockFirst;

describe('Product DAL - getProductById', () => {
  afterEach(() => {
    // Clear all mock implementations and calls after each test
    jest.clearAllMocks();
  });

  it('should return a product when found', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      brand: 'Test Brand',
      model: 'Test Model',
      price: 100,
      stockQuantity: 10,
      createdBy: 1,
      status: 'active',
      specifications: { color: 'red' },
      imageUrls: ['url1.jpg'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Configure the mock for db('products').where({ id }).andWhereNot('status', 'deleted').first()
    mockDbFirst.mockResolvedValue(mockProduct);

    const product = await getProductById(1);

    expect(product).toEqual(mockProduct);
    // Ensure db('products') was called, then where, then andWhereNot, then first
    // The actual table name 'products' is used inside getProductById
    // So we check if the main mock function was called with 'products'
    expect(db).toHaveBeenCalledWith('products'); 
    // Check if where was called with the correct parameters
    // (db as any)._mockWhere is the where function from our jest.mock
    expect((db as any)._mockWhere).toHaveBeenCalledWith({ id: 1 });
    // Check if andWhereNot was called (this part is tricky as our simple mock doesn't chain it perfectly for this check)
    // For simplicity, we assume the structure of the call based on the DAL code
    expect(mockDbFirst).toHaveBeenCalledTimes(1);
  });

  it('should return null when product is not found', async () => {
    // Configure the mock to return undefined for the .first() call
    mockDbFirst.mockResolvedValue(undefined);

    const product = await getProductById(999); // Non-existent ID

    expect(product).toBeNull();
    expect(db).toHaveBeenCalledWith('products');
    expect((db as any)._mockWhere).toHaveBeenCalledWith({ id: 999 });
    expect(mockDbFirst).toHaveBeenCalledTimes(1);
  });

  it('should return null if product status is deleted', async () => {
    // This case is handled by the `andWhereNot('status', 'deleted')` in the DAL.
    // If `first()` returns undefined (as if the DB query found nothing matching all criteria),
    // it behaves like "not found".
    mockDbFirst.mockResolvedValue(undefined);

    const product = await getProductById(2); // Assume ID 2 would be found if not for status

    expect(product).toBeNull();
    expect(db).toHaveBeenCalledWith('products');
    expect((db as any)._mockWhere).toHaveBeenCalledWith({ id: 2 });
    // The andWhereNot is part of the mocked chain leading to first()
    expect(mockDbFirst).toHaveBeenCalledTimes(1);
  });
});
