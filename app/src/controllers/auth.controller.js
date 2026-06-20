const authService = require('../services/auth.service');

/**
 * POST /auth/signup
 * Register a new user.
 */
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'name, email, and password are required.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }

  const result = await authService.signup({ name, email, password });

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: result.data,
  });
};

/**
 * POST /auth/login
 * Authenticate a user and return a JWT.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'email and password are required.',
    });
  }

  const result = await authService.login({ email, password });

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: result.data,
  });
};

module.exports = { signup, login };
