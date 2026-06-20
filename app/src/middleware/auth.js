const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT authentication middleware.
 * Reads the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or malformed. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded; // attach { id, email, iat, exp } to the request
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = { authenticate };
