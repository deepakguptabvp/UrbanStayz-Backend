import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import Property from "../models/PropertyModel.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Professional English Fallback Generator if Gemini API key is missing or quota is exceeded
 */
const getFallbackResponse = (userMessage, sampleProperties = []) => {
  const lower = (userMessage || "").toLowerCase();

  if (
    lower.includes("visit") ||
    lower.includes("schedule") ||
    lower.includes("book visit") ||
    lower.includes("tour") ||
    lower.includes("dekhe")
  ) {
    return (
      "You can schedule a complimentary in-person visit on any property page by clicking the **'Schedule a Free Visit'** button. " +
      "Simply choose your preferred date and convenient time slot, and our property manager will be delighted to guide you through the premises. It is completely free of charge!"
    );
  }

  if (
    lower.includes("deposit") ||
    lower.includes("security") ||
    lower.includes("brokerage") ||
    lower.includes("fee") ||
    lower.includes("commission")
  ) {
    return (
      "UrbanStayz operates with **Zero Brokerage**—you never pay any agent fees! " +
      "The security deposit is typically equivalent to one month's refundable rent, which is returned in full at the time of move-out. There are no hidden charges."
    );
  }

  if (
    lower.includes("amenities") ||
    lower.includes("facility") ||
    lower.includes("wifi") ||
    lower.includes("food") ||
    lower.includes("meal") ||
    lower.includes("laundry") ||
    lower.includes("khana")
  ) {
    return (
      "All verified UrbanStayz accommodations come equipped with premium amenities, including:\n" +
      "• **3 Nutritious Meals Daily:** Fresh, hygienic, and home-style cooking\n" +
      "• **High-Speed Wi-Fi & Power Backup:** Uninterrupted connectivity for work and studies\n" +
      "• **Housekeeping & Laundry:** Regular room cleaning and automated laundry facilities\n" +
      "• **24/7 Security:** CCTV surveillance, biometric entry, and dedicated security guards\n" +
      "• **Air Conditioning & Geysers:** Modern climate control and attached bathrooms"
    );
  }

  // Normalize text: handle "15k" -> "15000", "30k" -> "30000"
  const normalized = lower.replace(/(\d+)\s*k\b/gi, (match, p1) => `${p1}000`);

  // Detect Price Ranges and Budgets
  let minBudget = null;
  let maxBudget = null;

  const rangeMatch = normalized.match(/(\d{4,6})\s*(?:-|to|and)\s*(\d{4,6})/i);
  if (rangeMatch) {
    const val1 = parseInt(rangeMatch[1], 10);
    const val2 = parseInt(rangeMatch[2], 10);
    minBudget = Math.min(val1, val2);
    maxBudget = Math.max(val1, val2);
  } else {
    const aboveMatch = normalized.match(/(?:above|more than|greater than|min|minimum|over|from)\s*(\d{4,6})/i);
    if (aboveMatch) minBudget = parseInt(aboveMatch[1], 10);

    const underMatch = normalized.match(/(?:under|below|less than|max|maximum|within|upto|up to)\s*(\d{4,6})/i);
    if (underMatch) maxBudget = parseInt(underMatch[1], 10);

    if (minBudget === null && maxBudget === null) {
      const singleNum = normalized.match(/\b(\d{4,6})\b/);
      if (singleNum) maxBudget = parseInt(singleNum[1], 10);
    }
  }

  const hasBudgetQuery = minBudget !== null || maxBudget !== null;

  if (
    hasBudgetQuery ||
    lower.includes("price") ||
    lower.includes("rent") ||
    lower.includes("cost") ||
    lower.includes("budget") ||
    lower.includes("between") ||
    lower.includes("under")
  ) {
    let filtered = [...sampleProperties];
    if (minBudget !== null && maxBudget !== null) {
      filtered = filtered.filter((p) => p.price >= minBudget && p.price <= maxBudget);
    } else if (minBudget !== null) {
      filtered = filtered.filter((p) => p.price >= minBudget);
    } else if (maxBudget !== null) {
      filtered = filtered.filter((p) => p.price <= maxBudget);
    }

    filtered.sort((a, b) => a.price - b.price);

    let propList = "";
    if (filtered.length > 0) {
      propList =
        "\n\nHere are verified accommodations matching your budget:\n" +
        filtered
          .slice(0, 3)
          .map(
            (p) =>
              `• **${p.name || p.title}** (${p.city || p.location?.city || "Delhi NCR"}) — ₹${p.price?.toLocaleString()}/month`
          )
          .join("\n");
    }

    if (minBudget !== null && maxBudget !== null) {
      return (
        `We have verified accommodations in the **₹${minBudget.toLocaleString()} – ₹${maxBudget.toLocaleString()}/month** range.${propList}\n\nYou can use our Filter Bar to explore all amenities and book visits!`
      );
    }

    if (maxBudget !== null) {
      return (
        `We offer verified accommodations under **₹${maxBudget.toLocaleString()}/month** across single and shared configurations.${propList}\n\nYou can use our Filter Bar to sort listings that align with your exact budget!`
      );
    }

    return (
      `Our rental accommodations range from ₹5,000 to ₹35,000 per month across Single, Double, and Triple sharing configurations.${propList}\n\nYou can use our Filter Bar to effortlessly sort listings that align with your exact budget!`
    );
  }

  if (
    lower.includes("delhi") ||
    lower.includes("noida") ||
    lower.includes("gurgaon") ||
    lower.includes("bangalore") ||
    lower.includes("location") ||
    lower.includes("city")
  ) {
    return (
      "UrbanStayz provides verified accommodations across Delhi, Noida, Greater Noida, Gurgaon, Bangalore, and major student & tech hubs. " +
      "Please navigate to our **'All Listings'** page and apply the city filter to discover prime stays close to your college or workplace!"
    );
  }

  if (
    lower.includes("contact") ||
    lower.includes("phone") ||
    lower.includes("call") ||
    lower.includes("support") ||
    lower.includes("email")
  ) {
    return (
      "Our customer assistance team is readily available to assist you:\n" +
      "• **Email:** support@urbanstayz.com\n" +
      "• **Phone:** +91 98765 43210\n" +
      "• You can also submit an inquiry directly through our **Contact Us** page!"
    );
  }

  return (
    "Hello! I am Riya, your dedicated UrbanStayz Assistant. I am here to assist you with:\n" +
    "1. Finding premier PGs and co-living stays tailored to your budget and preferred location.\n" +
    "2. Scheduling a complimentary in-person property visit.\n" +
    "3. Answering questions regarding amenities, rent, zero-brokerage, and safety policies.\n\n" +
    "How may I assist you today?"
  );
};

/**
 * @desc    Chat with UrbanStayz AI Assistant
 * @route   POST /api/chatbot/message
 * @access  Public
 */
export const handleChatMessage = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return ApiResponse.error(res, "Message cannot be empty", 400);
  }

  const trimmedMessage = message.trim();

  // Fetch a snapshot of actual properties from the database for rich context if connected
  let properties = [];
  try {
    if (mongoose.connection.readyState === 1) {
      properties = await Property.find({ isActive: { $ne: false } })
        .select("name title propertyType type genderPreference furnishing price location city amenities rating isVerified")
        .limit(8)
        .lean()
        .maxTimeMS(2500);
    }
  } catch (err) {
    console.warn("Could not fetch properties snapshot for chatbot:", err.message);
  }

  // Find relevant properties to recommend as cards if user asks for recommendations
  let suggestedProperties = [];
  const lowerMsg = trimmedMessage.toLowerCase();
  const normalizedMsg = lowerMsg.replace(/(\d+)\s*k\b/gi, (match, p1) => `${p1}000`);

  let minB = null;
  let maxB = null;
  const rMatch = normalizedMsg.match(/(\d{4,6})\s*(?:-|to|and)\s*(\d{4,6})/i);
  if (rMatch) {
    minB = Math.min(parseInt(rMatch[1], 10), parseInt(rMatch[2], 10));
    maxB = Math.max(parseInt(rMatch[1], 10), parseInt(rMatch[2], 10));
  } else {
    const abMatch = normalizedMsg.match(/(?:above|more than|greater than|min|minimum|over|from)\s*(\d{4,6})/i);
    if (abMatch) minB = parseInt(abMatch[1], 10);
    const unMatch = normalizedMsg.match(/(?:under|below|less than|max|maximum|within|upto|up to)\s*(\d{4,6})/i);
    if (unMatch) maxB = parseInt(unMatch[1], 10);
  }

  let filteredForCards = [...properties];
  if (minB !== null && maxB !== null) {
    filteredForCards = filteredForCards.filter((p) => p.price >= minB && p.price <= maxB);
  } else if (minB !== null) {
    filteredForCards = filteredForCards.filter((p) => p.price >= minB);
  } else if (maxB !== null) {
    filteredForCards = filteredForCards.filter((p) => p.price <= maxB);
  }

  if (filteredForCards.length > 0) {
    filteredForCards.sort((a, b) => a.price - b.price);
    suggestedProperties = filteredForCards.slice(0, 3).map((p) => ({
      _id: p._id,
      name: p.name || p.title,
      price: p.price,
      city: p.city || p.location?.city || "Delhi NCR",
      type: p.type || p.propertyType,
      rating: p.rating || 4.5,
      image: p.imageUrl || (p.images && p.images[0]) || "",
    }));
  }

  // Prepare system context
  const propertyContextSummary = properties
    .map(
      (p, i) =>
        `${i + 1}. ${p.name || p.title} in ${p.city || p.location?.city || "Delhi NCR"} - Price: ₹${p.price}/mo, Type: ${p.type || p.genderPreference || "Co-living"}, Amenities: ${(p.amenities || []).slice(0, 5).join(", ")}`
    )
    .join("\n");

  const systemInstruction = `
You are Riya, the courteous, friendly, and professional accommodation advisor for UrbanStayz (a premier student & working professional PG/Hostel and co-living rental platform).

CRITICAL LANGUAGE REQUIREMENT:
- All your responses must be written EXCLUSIVELY in professional, polished English.
- Do NOT use Hindi or Hinglish phrases. Even if the user inquires in Hindi or another language, politely and professionally answer in English.

UrbanStayz Platform Highlights:
- 100% Zero Brokerage guarantee across all verified accommodations.
- Premium amenities: 24/7 Security, High-Speed Wi-Fi, 3 daily hygienic meals, laundry, power backup.
- Flexible contracts with a standard 1-month refundable security deposit.
- Instant 'Schedule a Free Visit' feature on every property page.

Available Sample Properties currently in our database:
${propertyContextSummary || "Various verified PGs in Delhi, Noida, Gurgaon, Bangalore starting from ₹6,500/month."}

Response Guidelines:
1. Maintain an elegant, helpful, and courteous tone.
2. Structure answers neatly with concise paragraphs, bullet points, and bold emphasis where appropriate.
3. Guide users on how to schedule free visits, use the filter bar, and review property details.
4. If asked about non-real-estate topics, politely redirect the conversation back to finding ideal accommodations on UrbanStayz.
`;

  // Attempt to call Gemini API if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build conversation contents
      const contents = [];

      // Add recent history (up to last 6 turns)
      if (Array.isArray(history)) {
        history.slice(-6).forEach((item) => {
          if (item.text) {
            contents.push({
              role: item.role === "user" ? "user" : "model",
              parts: [{ text: item.text }],
            });
          }
        });
      }

      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: trimmedMessage }],
      });

      // Generate response using Gemini 2.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "How may I assist you with your accommodation search today?";

      return ApiResponse.success(res, {
        reply,
        suggestedProperties,
        poweredBy: "Riya - UrbanStayz",
      });
    } catch (apiError) {
      console.error("Gemini API call error (falling back to smart assistant):", apiError.message);
      const reply = getFallbackResponse(trimmedMessage, properties);
      return ApiResponse.success(res, {
        reply,
        suggestedProperties,
        poweredBy: "Riya - UrbanStayz",
        note: "AI key fallback active",
      });
    }
  }

  // If no Gemini API key is configured yet, use professional English fallback
  const reply = getFallbackResponse(trimmedMessage, properties);
  return ApiResponse.success(res, {
    reply,
    suggestedProperties,
    poweredBy: "Riya - UrbanStayz",
    apiKeyMissing: true,
  });
});

/**
 * @desc    Get Chatbot Starter Suggestions
 * @route   GET /api/chatbot/suggestions
 * @access  Public
 */
export const getChatbotSuggestions = asyncHandler(async (req, res) => {
  const suggestions = [
    "Find PG under ₹10,000",
    "How to schedule a free visit?",
    "What amenities are included?",
    "Is there any brokerage or deposit?",
    "Accommodations in Delhi & Noida",
    "Customer Support Contact",
  ];

  return ApiResponse.success(res, { suggestions });
});
