import { verifyToken } from '../utils/jwt.js';
import { storage } from '../data/dbStorage.js';

export function authenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Authentication session expired or invalid token. Please log in again.',
    });
  }

  // Look up user from storage to get freshest profile
  const user = storage.findUserById(decoded.id) || decoded;
  req.user = user;
  next();
}
