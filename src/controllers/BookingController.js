import Booking from "../models/BookingModel.js";
import Property from "../models/PropertyModel.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Create a new visit schedule or room booking request
 * @route   POST /api/bookings
 * @access  Public (Optional auth)
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    propertyId,
    property: propId,
    name,
    phone,
    email,
    visitDate,
    timeSlot,
    occupancyType,
    message,
  } = req.body;

  const targetPropertyId = propertyId || propId;

  if (!targetPropertyId || !name || !phone || !visitDate) {
    throw new ApiError(
      400,
      "Property, full name, phone number, and visit date are required."
    );
  }

  const property = await Property.findById(targetPropertyId);
  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  const booking = await Booking.create({
    property: property._id,
    user: req.user ? req.user._id : undefined,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    visitDate: new Date(visitDate),
    timeSlot: timeSlot || "Morning (10:00 AM - 01:00 PM)",
    occupancyType: occupancyType || "Single Room",
    message: message || "",
  });

  return ApiResponse.success(
    res,
    booking,
    "Visit request submitted successfully! The property manager will contact you shortly.",
    201
  );
});

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings/my
 * @access  Private
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    $or: [{ user: req.user._id }, { phone: req.user.phone }],
  })
    .populate("property")
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, bookings, "My bookings retrieved");
});

/**
 * @desc    Get bookings for a specific property (For host/owner)
 * @route   GET /api/bookings/property/:propertyId
 * @access  Private (Owner/Admin)
 */
export const getPropertyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    property: req.params.propertyId,
  }).sort({ createdAt: -1 });

  return ApiResponse.success(res, bookings, "Property bookings retrieved");
});

/**
 * @desc    Update booking status (Confirm/Cancel/Complete)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Owner/Admin)
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("property");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return ApiResponse.success(res, booking, `Booking status updated to ${status}`);
});
