import { Request, Response } from 'express';
import { createProductHandler } from '../productController'; // Adjust path as necessary
import * as dbKnex from '../../db/knex'; // To mock the default export 'db'
import { Product } from '../../models/productModel'; // For typing mock product
import { CreateProductInput } from '../../schemas/productSchemas';

// Mock the db instance and its methods used by insertProduct
// insertProduct uses db('products').insert(...).returning('*')
jest.mock('../../db/knex', () => {
  const mockReturning = jest.fn();
  const mockInsert = jest.fn(() => ({ returning: mockReturning }));
  
  const mockDbInstance = jest.fn((tableName: string) => ({
    insert: mockInsert,
  }));

  // Store references for manipulation/assertions in tests
  (mockDbInstance as any)._mockInsert = mockInsert;
  (mockDbInstance as any)._mockReturning = mockReturning;

  return mockDbInstance;
});


describe('Product Controller - createProductHandler', () => {
  let mockRequest: Partial<Request> & { user?: any, body: CreateProductInput };
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  // Helper to access the Knex mock's sub-functions
  const knexMockInsert = (dbKnex as any)._mockInsert;
  const knexMockReturning = (dbKnex as any)._mockReturning;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis(); // Allows chaining .json()
    
    // Reset mockRequest for each test to ensure body and user are clean
    mockRequest = {
        body: { // Provide default valid body, can be overridden by tests
            name: 'Test Product',
            price: 100,
            description: 'Test Description',
            image_url: 'http://example.com/image.png'
        },
        user: { // Mock admin user
            id: 1, // Changed from userId to id
            role: 'admin' 
        }
    };

    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  const testDate = new Date();
  const mockCreatedProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    image_url: 'http://example.com/image.png',
    createdBy: 1,
    createdAt: testDate,
    updatedAt: testDate,
    status: 'active',
  };

  test('should successfully create a product with valid data by an admin', async () => {
    // Mock insertProduct's internal Knex call (insert().returning())
    // db('products').insert(...).returning('*') -> mockReturning should resolve to an array with the product
    knexMockReturning.mockResolvedValueOnce([
      { // Raw DB product, assuming DB columns match these names
        id: mockCreatedProduct.id,
        name: mockCreatedProduct.name,
        description: mockCreatedProduct.description,
        price: mockCreatedProduct.price,
        image_url: mockCreatedProduct.image_url,
        created_by: mockCreatedProduct.createdBy,
        created_at: mockCreatedProduct.createdAt,
        updated_at: mockCreatedProduct.updatedAt,
        status: mockCreatedProduct.status,
      }
    ]);

    await createProductHandler(mockRequest as Request, mockResponse as Response);

    expect(knexMockInsert).toHaveBeenCalledWith({
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      image_url: 'http://example.com/image.png',
      created_by: 1, // from req.user.userId
      status: 'active', // Default status set by insertProduct
    });
    expect(knexMockReturning).toHaveBeenCalledWith('*');
    expect(responseStatus).toHaveBeenCalledWith(201);
    // The responseJson should match the structure of 'Product' interface after mapping in insertProduct
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      id: mockCreatedProduct.id,
      name: mockCreatedProduct.name,
      description: mockCreatedProduct.description,
      price: mockCreatedProduct.price,
      image_url: mockCreatedProduct.image_url,
      createdBy: mockCreatedProduct.createdBy, // Note: createdBy not created_by
      status: mockCreatedProduct.status,
    }));
  });

  test('should correctly pass created_by from req.user.id to insertProduct', async () => { // Test name updated
    mockRequest.user!.id = 99; // Different admin ID, ensure user is not undefined with !
    const productWithDifferentAdmin = { ...mockCreatedProduct, createdBy: 99 };
    knexMockReturning.mockResolvedValueOnce([
        { ...productWithDifferentAdmin, created_by: 99, createdBy: undefined } // Simulate DB response
    ]);


    await createProductHandler(mockRequest as Request, mockResponse as Response);

    expect(knexMockInsert).toHaveBeenCalledWith(expect.objectContaining({
      created_by: 99,
    }));
    expect(responseStatus).toHaveBeenCalledWith(201);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      createdBy: 99,
    }));
  });

  test('should return 500 if insertProduct fails (e.g., DB error)', async () => {
    // Mock insertProduct's internal Knex call to reject
    knexMockInsert.mockImplementationOnce(() => ({ // Ensure returning is part of the chain for this mock
        returning: jest.fn().mockRejectedValueOnce(new Error('DB insert error'))
    }));
    
    await createProductHandler(mockRequest as Request, mockResponse as Response);

    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Error creating product' });
  });

  test('should return 500 if insertProduct does not return a product (empty array)', async () => {
    knexMockReturning.mockResolvedValueOnce([]); // Simulate insert returning empty

    await createProductHandler(mockRequest as Request, mockResponse as Response);
    
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Error creating product: Internal data operation failure.' });
  });
  
  test('should handle optional description and image_url correctly', async () => {
    mockRequest.body = {
        name: 'Minimal Product',
        price: 50,
        // description and image_url are optional and not provided
    };
    const minimalProductMock = { 
        ...mockCreatedProduct, 
        name: 'Minimal Product', 
        price: 50, 
        description: undefined, 
        image_url: undefined 
    };
    knexMockReturning.mockResolvedValueOnce([
        { // DB raw response
            id: minimalProductMock.id,
            name: minimalProductMock.name,
            price: minimalProductMock.price,
            created_by: minimalProductMock.createdBy,
            created_at: minimalProductMock.createdAt,
            updated_at: minimalProductMock.updatedAt,
            status: minimalProductMock.status,
            // description and image_url would be null or not present from DB
        }
    ]);

    await createProductHandler(mockRequest as Request, mockResponse as Response);

    expect(knexMockInsert).toHaveBeenCalledWith({
        name: 'Minimal Product',
        price: 50,
        description: undefined, // Zod schema makes it optional
        image_url: undefined,   // Zod schema makes it optional
        created_by: 1,
        status: 'active',
    });
    expect(responseStatus).toHaveBeenCalledWith(201);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Minimal Product',
        price: 50,
        description: undefined, // or null depending on DB/Knex behavior for undefined insert
        image_url: undefined,
    }));
  });
});
