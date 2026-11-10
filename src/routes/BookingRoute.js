import express from "express";
import {
  createBooking,
  getMyBookings,
  getPropertyBookings,
  updateBookingStatus,
} from "../controllers/BookingController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create booking (public, with optional user token attached)
router.post("/", createBooking);

// User's own bookings
router.get("/my", protect, getMyBookings);

// Host / Admin property bookings
router.get(
  "/property/:propertyId",
  protect,
  authorize("owner", "admin"),
  getPropertyBookings
);

// Update booking status
router.put(
  "/:id/status",
  protect,
  authorize("owner", "admin"),
  updateBookingStatus
);

export default router;
