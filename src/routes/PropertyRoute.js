import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getFeaturedProperties,
  getCityStats,
} from "../controllers/PropertyController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Specific sub-routes (before parameterized routes)
router.get("/featured", getFeaturedProperties);
router.get("/stats/cities", getCityStats);

// Main collection routes
router
  .route("/")
  .get(getAllProperties)
  .post(protect, authorize("owner", "admin"), createProperty);

// Single item routes
router
  .route("/:id")
  .get(getPropertyById)
  .put(protect, authorize("owner", "admin"), updateProperty)
  .delete(protect, authorize("owner", "admin"), deleteProperty);

export default router;
