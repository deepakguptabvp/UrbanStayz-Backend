import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Protect routes - Verifies JWT bearer token and sets req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "urbanstayz_default_secret_fallback_key"
      );

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        throw new ApiError(401, "User belonging to this token no longer exists.");
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(401, "Not authorized to access this route. Invalid or expired token."));
      }
    }
  }

  if (!token) {
    next(new ApiError(401, "Not authorized to access this route. No token provided."));
  }
});

/**
 * Role authorization middleware
 * @param  {...string} roles - allowed roles e.g. 'admin', 'owner'
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user?.role}' is not authorized to access this route`
        )
      );
    }
    next();
  };
};
