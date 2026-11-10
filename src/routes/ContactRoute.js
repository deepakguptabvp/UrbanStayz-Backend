import express from "express";
import {
  submitContact,
  getAllContacts,
  updateContactStatus,
} from "../controllers/ContactController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", submitContact);
router.get("/", protect, authorize("admin"), getAllContacts);
router.put("/:id/status", protect, authorize("admin"), updateContactStatus);

export default router;
