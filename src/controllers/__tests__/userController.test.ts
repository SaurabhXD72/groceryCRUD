import { Request, Response } from 'express';
import { getCurrentUserProfile } from '../userController'; // Adjust path as necessary
import * as dbKnex from '../../db/knex'; // To mock the default export 'db'
import { User, UserDTO } from '../../models/userModel';

// Mock the db instance and its methods
// We need to mock the internal getUserByIdForProfile function, which uses db.
// Specifically, it calls db('users').where({ id }).first()
jest.mock('../../db/knex', () => {
  const mockFirst = jest.fn();
  const mockWhere = jest.fn(() => ({ first: mockFirst }));
  
  const mockDbInstance = jest.fn((tableName: string) => ({
    where: mockWhere,
    first: mockFirst, // if db('table').first() is called
  }));

  // Store references to the chained mock functions for manipulation in tests
  (mockDbInstance as any)._mockFirst = mockFirst;
  (mockDbInstance as any)._mockWhere = mockWhere;

  return mockDbInstance;
});

describe('User Controller - getCurrentUserProfile', () => {
  let mockRequest: Partial<Request> & { user?: any }; // Ensure req.user can be set
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  // Helper to access the Knex mock's sub-functions
  const knexMockFirst = (dbKnex as any)._mockFirst;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis(); // Allows chaining .json()
    mockRequest = {}; // Reset request object
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  const testDate = new Date();
  const mockUserFromDb: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123', // Not directly used by DTO, but part of User model
    role: 'customer',
    name: 'Test User',
    createdAt: testDate,
    updatedAt: testDate,
  };

  const mockUserDto: UserDTO = {
    id: 1,
    email: 'test@example.com',
    role: 'customer',
    name: 'Test User',
    createdAt: testDate,
    updatedAt: testDate,
  };

  test('should retrieve current user profile successfully', async () => {
    mockRequest.user = { userId: 1, email: 'test@example.com', role: 'customer' };
    
    // Mock internal getUserByIdForProfile (which uses knexMockFirst)
    knexMockFirst.mockResolvedValueOnce(mockUserFromDb);

    await getCurrentUserProfile(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1);
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(mockUserDto);
  });

  test('should return 401 if req.user is missing', async () => {
    // mockRequest.user is not set
    
    await getCurrentUserProfile(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(401);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Not authenticated or user ID missing from token' });
  });
  
  test('should return 401 if req.user.userId is missing', async () => {
    mockRequest.user = { email: 'test@example.com', role: 'customer' }; // userId is missing
    
    await getCurrentUserProfile(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(401);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Not authenticated or user ID missing from token' });
  });

  test('should return 404 if user not found in DB by ID from req.user.userId (edge case)', async () => {
    mockRequest.user = { userId: 999, email: 'ghost@example.com', role: 'customer' };
    
    // Mock internal getUserByIdForProfile to return null
    knexMockFirst.mockResolvedValueOnce(null);

    await getCurrentUserProfile(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1);
    expect(responseStatus).toHaveBeenCalledWith(404);
    expect(responseJson).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('should return 500 if there is a database error', async () => {
    mockRequest.user = { userId: 1, email: 'test@example.com', role: 'customer' };
    
    // Mock internal getUserByIdForProfile to throw an error
    knexMockFirst.mockRejectedValueOnce(new Error('Database error'));

    await getCurrentUserProfile(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1);
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Error retrieving user profile' });
  });
});
