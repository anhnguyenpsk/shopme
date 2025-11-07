import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_VERIFICATION_SECRET || 'your-verification-secret-key-change-this';
const EXPIRATION_TIME = 3 * 60; // 3 minutes in seconds

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a JWT token containing email and verification code
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @returns {string} JWT token
 */
export function createVerificationToken(email, code) {
  const payload = {
    email,
    code,
    exp: Math.floor(Date.now() / 1000) + EXPIRATION_TIME,
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verify and decode a JWT verification token
 * @param {string} token - JWT token to verify
 * @returns {{email: string, code: string, exp: number} | null} Decoded payload or null if invalid
 */
export function verifyVerificationToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Check if a verification code matches the token and is not expired
 * @param {string} token - JWT token
 * @param {string} code - Code to verify
 * @param {string} email - Email to verify
 * @returns {{valid: boolean, message: string, email?: string}}
 */
export function validateVerificationCode(token, code, email) {
  if (!token || !code || !email) {
    return {
      valid: false,
      message: 'Missing required fields',
    };
  }

  const decoded = verifyVerificationToken(token);

  if (!decoded) {
    return {
      valid: false,
      message: 'Invalid or expired verification code',
    };
  }

  // Check if email matches
  if (decoded.email !== email) {
    return {
      valid: false,
      message: 'Email does not match verification token',
    };
  }

  // Check if code matches
  if (decoded.code !== code) {
    return {
      valid: false,
      message: 'Incorrect verification code',
    };
  }

  // Check if token is expired (jwt.verify already checks this, but we double-check)
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    return {
      valid: false,
      message: 'Verification code has expired',
    };
  }

  return {
    valid: true,
    message: 'Verification successful',
    email: decoded.email,
  };
}

/**
 * Get remaining time in seconds for a token
 * @param {string} token - JWT token
 * @returns {number} Remaining seconds, or 0 if expired/invalid
 */
export function getRemainingTime(token) {
  const decoded = verifyVerificationToken(token);
  if (!decoded) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  
  return remaining > 0 ? remaining : 0;
}













