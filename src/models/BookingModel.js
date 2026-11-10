import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required for booking/visit"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    visitDate: {
      type: Date,
      required: [true, "Preferred visit date is required"],
    },
    timeSlot: {
      type: String,
      enum: [
        "Morning (10:00 AM - 01:00 PM)",
        "Afternoon (01:00 PM - 04:00 PM)",
        "Evening (04:00 PM - 07:00 PM)",
        "Anytime",
      ],
      default: "Morning (10:00 AM - 01:00 PM)",
    },
    occupancyType: {
      type: String,
      enum: ["Single Room", "Double Sharing", "Triple Sharing", "Four Sharing", "Any"],
      default: "Single Room",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
