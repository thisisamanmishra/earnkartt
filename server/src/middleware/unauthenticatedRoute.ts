// unauthenticatedRoutesMiddleware.ts
import { NextFunction, Request, Response } from 'express';

const unauthenticatedRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the request method is PATCH and the URL matches the route to approve users
  if (req.method === 'PATCH' && req.originalUrl.startsWith('/api/v1/auth/users')) {
    // Skip authentication for PATCH request to approve users
    return next();
  }
  // For all other routes, continue with authentication
  next();
};

export default unauthenticatedRoute;
