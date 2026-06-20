const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const env = require('../config/env');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} userData
 */
const signup = async ({ name, email, password }) => {
  try {
    // Check if the email is already taken
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return {
        success: false,
        statusCode: 409,
        message: 'An account with this email already exists.',
      };
    }

    // Hash the password before storing
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    };
  } catch (err) {
    console.error('[AuthService] signup error:', err.message);
    return {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};

/**
 * Authenticate a user and return a signed JWT.
 * @param {{ email: string, password: string }} credentials
 */
const login = async ({ email, password }) => {
  try {
    const result = await query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Use a generic message to avoid user enumeration
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid credentials.',
      };
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid credentials.',
      };
    }

    // Sign a JWT with the user's id and email
    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    };
  } catch (err) {
    console.error('[AuthService] login error:', err.message);
    return {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};

module.exports = { signup, login };
