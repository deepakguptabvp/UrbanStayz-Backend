import express from "express";
import {
  handleChatMessage,
  getChatbotSuggestions,
} from "../controllers/ChatbotController.js";

const router = express.Router();

router.post("/message", handleChatMessage);
router.get("/suggestions", getChatbotSuggestions);

export default router;
