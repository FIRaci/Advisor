import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    nextFunction = vi.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should return 401 if no authorization header is provided', async () => {
    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is not a Bearer token', async () => {
    mockRequest.headers = { authorization: 'Basic some_token' };
    
    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() and set req.userId if token is valid', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: '12345' } as any);

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
    
    expect(mockRequest.userId).toBe('12345');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 500 if JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;
    mockRequest.headers = { authorization: 'Bearer some_token' };

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
