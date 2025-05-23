import { Request, Response } from 'express';
import { register } from '../authController'; // Adjust path as necessary
import * as dbKnex from '../../db/knex'; // To mock the default export 'db'
import * as authUtils from '../../utils/auth'; // To mock hashPassword, generateToken
import { User, UserDTO } from '../../models/userModel';

// Mock the db instance and its methods
// We need to mock the functions that are defined inside authController
// that use 'db'. These are: emailExists, createUser.
// For createUser, it calls db('users').insert(...) and then db('users').where(...).first()
// For emailExists, it calls db('users').where(...).count(...).first()

// Define a type for our mock db functions for clarity
type MockDbUserFunctions = {
  emailExists: jest.Mock;
  createUser: jest.Mock;
};

// Use a variable to hold the mock functions so they can be manipulated in tests
let mockDbUserFunctions: MockDbUserFunctions;

jest.mock('../../db/knex', () => {
  const mockInsert = jest.fn();
  const mockFirst = jest.fn();
  const mockCount = jest.fn(() => ({ first: mockFirst }));
  const mockWhere = jest.fn(() => ({ count: mockCount, first: mockFirst }));
  
  // This is the actual 'db' instance mock
  const mockDbInstance = jest.fn((tableName: string) => ({
    insert: mockInsert,
    where: mockWhere,
    first: mockFirst, // if db('table').first() is called
  }));

  // Store references to the chained mock functions for manipulation in tests
  (mockDbInstance as any)._mockInsert = mockInsert;
  (mockDbInstance as any)._mockFirst = mockFirst;
  (mockDbInstance as any)._mockWhere = mockWhere;
  (mockDbInstance as any)._mockCount = mockCount; // Expose mockCount

  return mockDbInstance;
});


// Mock utility functions
jest.mock('../../utils/auth', () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
  verifyPassword: jest.fn(), // Though not used by register, good to have if testing login
  authenticateJWT: jest.fn(),// For other controller methods if tested here
}));


describe('Auth Controller - Register', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  // Helper to access the Knex mock's sub-functions if needed
  const knexMockInsert = (dbKnex as any)._mockInsert;
  const knexMockFirst = (dbKnex as any)._mockFirst;
  // const knexMockWhere = (dbKnex as any)._mockWhere; // Not directly used for assertions here
  const knexMockCountResult = (dbKnex as any)._mockFirst; // emailExists uses .count().first()

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis(); // Allows chaining .json()
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123', // In DB it's hashed
    role: 'customer',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserDto: UserDTO = {
    id: 1,
    email: 'test@example.com',
    role: 'customer',
    name: 'Test User',
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  test('should register a new customer successfully with name', async () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    // Mocking internal DB calls for register:
    // 1. emailExists -> db('users').where(...).count().first()
    knexMockCountResult.mockResolvedValueOnce({ count: 0 }); // email does not exist

    // 2. hashPassword (utility)
    (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
    
    // 3. createUser -> db('users').insert(...) then db('users').where(...).first()
    knexMockInsert.mockResolvedValueOnce([1]); // insert returns [insertId]
    knexMockFirst.mockResolvedValueOnce(mockUser); // find user after creation

    // 4. generateToken (utility)
    (authUtils.generateToken as jest.Mock).mockReturnValue('mockToken123');

    await register(mockRequest as Request, mockResponse as Response);

    expect(authUtils.hashPassword).toHaveBeenCalledWith('password123');
    expect(knexMockInsert).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      password: 'hashedPassword123',
      name: 'Test User',
      role: 'customer', // Default role
    }));
    expect(authUtils.generateToken).toHaveBeenCalledWith(mockUser);
    expect(responseStatus).toHaveBeenCalledWith(201);
    expect(responseJson).toHaveBeenCalledWith({
      message: 'User registered successfully',
      user: expect.objectContaining({ email: 'test@example.com', name: 'Test User', role: 'customer' }),
      token: 'mockToken123',
    });
  });

  test('should register a new customer successfully without name', async () => {
    mockRequest.body = {
      email: 'test2@example.com',
      password: 'password123',
      // name is not provided
    };
    const userWithoutName = { ...mockUser, id: 2, email: 'test2@example.com', name: undefined };

    knexMockCountResult.mockResolvedValueOnce({ count: 0 });
    (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
    knexMockInsert.mockResolvedValueOnce([2]);
    knexMockFirst.mockResolvedValueOnce(userWithoutName);
    (authUtils.generateToken as jest.Mock).mockReturnValue('mockToken456');

    await register(mockRequest as Request, mockResponse as Response);

    const expectedInsertObject = {
      email: 'test2@example.com',
      password: 'hashedPassword123',
      role: 'customer',
    };
    expect(knexMockInsert).toHaveBeenCalledWith(expect.objectContaining(expectedInsertObject));
    // Also ensure 'name' is not part of the actual call if it was undefined in input
    const actualInsertArg = (knexMockInsert as jest.Mock).mock.calls[0][0];
    expect(actualInsertArg.name).toBeUndefined();

    expect(responseStatus).toHaveBeenCalledWith(201);
    // Ensure the returned user DTO also has name as undefined or not present
    // based on how toUserDTO and User/UserDTO models are defined.
    // Assuming 'name' field would be undefined if not set.
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ 
          email: 'test2@example.com', 
          role: 'customer', 
          name: undefined // Or whatever toUserDTO produces for an undefined name
        }),
        token: 'mockToken456',
      }));
  });

  test('should register a new admin successfully with name and role', async () => {
    mockRequest.body = {
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
    };
    const adminUser = { ...mockUser, id:3, email: 'admin@example.com', name: 'Admin User', role: 'admin' as 'admin' | 'customer' };

    knexMockCountResult.mockResolvedValueOnce({ count: 0 });
    (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPasswordAdmin');
    knexMockInsert.mockResolvedValueOnce([3]);
    knexMockFirst.mockResolvedValueOnce(adminUser);
    (authUtils.generateToken as jest.Mock).mockReturnValue('mockTokenAdmin');

    await register(mockRequest as Request, mockResponse as Response);

    expect(knexMockInsert).toHaveBeenCalledWith(expect.objectContaining({
        email: 'admin@example.com',
        password: 'hashedPasswordAdmin',
        name: 'Admin User',
        role: 'admin',
      }));
    expect(responseStatus).toHaveBeenCalledWith(201);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ email: 'admin@example.com', name: 'Admin User', role: 'admin' }),
        token: 'mockTokenAdmin',
      }));
  });
  
  test('should return 409 if email already exists', async () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };
    knexMockCountResult.mockResolvedValueOnce({ count: 1 }); // email exists

    await register(mockRequest as Request, mockResponse as Response);

    expect(responseStatus).toHaveBeenCalledWith(409);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Email already registered' });
  });

  test('should return 500 if createUser fails (e.g., DB error during insert)', async () => {
    mockRequest.body = {
      email: 'error@example.com',
      password: 'password123',
      name: 'Error User',
    };
    knexMockCountResult.mockResolvedValueOnce({ count: 0 }); // email does not exist
    (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPasswordError');
    knexMockInsert.mockRejectedValueOnce(new Error('DB insert error')); // Simulate insert failure

    await register(mockRequest as Request, mockResponse as Response);
    
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Error registering user' });
  });

  test('should return 500 if user retrieval after creation fails', async () => {
    mockRequest.body = {
      email: 'retrievefail@example.com',
      password: 'password123',
      name: 'Retrieve Fail User',
    };
    knexMockCountResult.mockResolvedValueOnce({ count: 0 });
    (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPasswordRetrieveFail');
    knexMockInsert.mockResolvedValueOnce([99]); // Insert succeeds
    knexMockFirst.mockResolvedValueOnce(null); // But retrieval fails

    await register(mockRequest as Request, mockResponse as Response);

    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Error creating user: Internal data retrieval error.' });
  });
});

// Import login method
import { login } from '../authController';

describe('Auth Controller - Login', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  // Helper to access the Knex mock's sub-functions if needed
  // getUserByEmail uses db('users').where({ email }).first()
  const knexMockFirst = (dbKnex as any)._mockFirst;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    jest.clearAllMocks();
  });

  const mockUserFromDb: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: 'customer',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserDto: UserDTO = {
    id: 1,
    email: 'test@example.com',
    role: 'customer',
    name: 'Test User',
    createdAt: mockUserFromDb.createdAt,
    updatedAt: mockUserFromDb.updatedAt,
  };

  test('should login successfully with correct credentials', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' };

    // Mock getUserByEmail to return a user
    knexMockFirst.mockResolvedValueOnce(mockUserFromDb);
    // Mock verifyPassword to return true
    (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
    // Mock generateToken
    (authUtils.generateToken as jest.Mock).mockReturnValue('mockLoginToken');

    await login(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1); // from getUserByEmail
    expect(authUtils.verifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword123');
    expect(authUtils.generateToken).toHaveBeenCalledWith(mockUserFromDb);
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith({
      message: 'Login successful',
      user: mockUserDto, // toUserDTO is called internally
      token: 'mockLoginToken',
    });
  });

  test('should return 401 for non-existent email', async () => {
    mockRequest.body = { email: 'nonexistent@example.com', password: 'password123' };

    // Mock getUserByEmail to return null
    knexMockFirst.mockResolvedValueOnce(null);

    await login(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1);
    expect(authUtils.verifyPassword).not.toHaveBeenCalled();
    expect(authUtils.generateToken).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(401);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  test('should return 401 for incorrect password', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };

    // Mock getUserByEmail to return a user
    knexMockFirst.mockResolvedValueOnce(mockUserFromDb);
    // Mock verifyPassword to return false
    (authUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

    await login(mockRequest as Request, mockResponse as Response);

    expect(knexMockFirst).toHaveBeenCalledTimes(1);
    expect(authUtils.verifyPassword).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
    expect(authUtils.generateToken).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(401);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });
});
