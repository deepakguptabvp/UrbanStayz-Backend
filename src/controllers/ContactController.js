import Contact from "../models/ContactModel.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Submit a contact / query message
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContact = asyncHandler(async (req, res) => {
  const { firstName, lastName, name, email, phone, phoneNo, number, message } = req.body;

  // Support various frontend parameter names for compatibility
  const resolvedFirstName = firstName || (name ? name.split(" ")[0] : "");
  const resolvedLastName = lastName || (name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : "");
  const resolvedPhone = phone || phoneNo || number || "";

  if (!resolvedFirstName || !email || !message) {
    throw new ApiError(400, "First name, email, and message are required.");
  }

  const contact = await Contact.create({
    firstName: resolvedFirstName.trim(),
    lastName: resolvedLastName.trim(),
    email: email.trim().toLowerCase(),
    phone: resolvedPhone.toString().trim(),
    message: message.trim(),
  });

  return ApiResponse.success(
    res,
    contact,
    "Thanks for reaching out! We'll get back to you soon.",
    201
  );
});

/**
 * @desc    Get all contact messages
 * @route   GET /api/contact
 * @access  Private (Admin)
 */
export const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });

  return ApiResponse.success(res, contacts, "Contact queries retrieved");
});

/**
 * @desc    Update contact message status
 * @route   PUT /api/contact/:id/status
 * @access  Private (Admin)
 */
export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!contact) {
    throw new ApiError(404, "Contact query not found");
  }

  return ApiResponse.success(res, contact, "Contact status updated");
});
