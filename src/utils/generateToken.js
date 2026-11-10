import jwt from "jsonwebtoken";

/**
 * Generate JWT token for user authentication
 * @param {string} userId - Mongo ID of the user
 * @returns {string} Signed JWT Token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "urbanstayz_default_secret_fallback_key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export default generateToken;
