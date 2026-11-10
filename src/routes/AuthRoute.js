import express from "express";
import {
  signup,
  sendOtp,
  verifyOtp,
  login,
  getMe,
  updateProfile,
  toggleBookmark,
} from "../controllers/AuthController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public auth routes
router.post("/signup", signup);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

// Protected user routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/bookmark/:propertyId", protect, toggleBookmark);

export default router;
