import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number },
    imageUrl: { type: String },
    type: { type: String, required: true },
    amenities: [String],
  },
  { timestamps: true }
);

export const Property = mongoose.model("Property", PropertySchema);
