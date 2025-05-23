import { Request, Response, NextFunction } from 'express';
import { adminOnlyMiddleware } from '../adminOnlyMiddleware'; // Adjust path as necessary

describe('Admin Only Middleware', () => {
  let mockRequest: Partial<Request> & { user?: any }; // To allow setting req.user
  let mockResponse: Partial<Response>;
  let mockNextFunction: jest.Mock<NextFunction>; // Mock for next()
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    mockRequest = {}; // Reset request object for each test
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis(); // Allows chaining .json()
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    mockNextFunction = jest.fn();
  });

  test('should call next() if user is an admin', () => {
    mockRequest.user = { role: 'admin' };

    adminOnlyMiddleware(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNextFunction
    );

    expect(mockNextFunction).toHaveBeenCalledTimes(1);
    expect(responseStatus).not.toHaveBeenCalled();
    expect(responseJson).not.toHaveBeenCalled();
  });

  test('should return 403 if user role is "customer"', () => {
    mockRequest.user = { role: 'customer' };

    adminOnlyMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNextFunction
    );

    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(403);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Forbidden: Admins only' });
  });

  test('should return 403 if user role is missing', () => {
    mockRequest.user = { /* role is missing */ };

    adminOnlyMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNextFunction
    );

    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(403);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Forbidden: Admins only' });
  });

  test('should return 403 if req.user is undefined', () => {
    // mockRequest.user is not set (i.e., undefined)

    adminOnlyMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNextFunction
    );

    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(403);
    expect(responseJson).toHaveBeenCalledWith({ message: 'Forbidden: Admins only' });
  });
});
