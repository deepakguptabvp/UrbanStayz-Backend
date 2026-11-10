import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Property name/title is required"],
      trim: true,
    },

    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "Comfortable and fully managed PG accommodation with modern amenities, high-speed WiFi, daily housekeeping, and premium security.",
    },

    propertyType: {
      type: String,
      enum: ["PG", "Hostel", "1BHK", "2BHK", "Apartment", "Co-living"],
      default: "PG",
    },

    type: {
      type: String,
      enum: [
        "Female Only",
        "Male Only",
        "Co-living",
        "Co-ed",
        "Boys Only",
        "Girls Only",
        "Family Friendly",
        "Any",
      ],
      default: "Co-living",
    },

    genderPreference: {
      type: String,
      enum: ["Male", "Female", "Co-ed", "Any"],
      default: "Any",
    },

    furnishing: {
      type: String,
      enum: ["Fully Furnished", "Semi Furnished", "Unfurnished"],
      default: "Fully Furnished",
    },

    price: {
      type: Number,
      required: [true, "Monthly rent price is required"],
      min: [0, "Price cannot be negative"],
    },

    securityDeposit: {
      type: Number,
      default: 0,
    },

    // Formatted location string for frontend e.g., "Koramangala, Bangalore"
    location: {
      type: String,
      required: [true, "Location is required"],
    },

    // Detailed structured address info
    addressDetails: {
      city: {
        type: String,
        trim: true,
      },
      area: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
    },

    // Geo coordinates for map rendering
    coordinates: {
      lat: {
        type: Number,
        default: 12.9716,
      },
      lng: {
        type: Number,
        default: 77.5946,
      },
    },

    // Primary image for fast list view
    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=70",
    },

    // Image gallery
    images: [
      {
        type: String,
      },
    ],

    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    nearMetro: {
      type: Boolean,
      default: false,
    },

    nearITPark: {
      type: Boolean,
      default: false,
    },

    includedFood: {
      type: Boolean,
      default: false,
    },

    roomSharingOptions: [
      {
        sharingType: {
          type: String,
          enum: ["Single Room", "Double Sharing", "Triple Sharing", "Four Sharing"],
        },
        price: Number,
        availableBeds: {
          type: Number,
          default: 1,
        },
      },
    ],

    owner: {
      name: {
        type: String,
        default: "UrbanStayz Host",
      },
      phone: {
        type: String,
        default: "+91 9876543210",
      },
      email: {
        type: String,
        default: "stay@urbanstayz.com",
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },

    ratings: {
      type: Number,
      default: 4.5,
    },

    numReviews: {
      type: Number,
      default: 12,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property 'id' to map _id for frontend compatibility
propertySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Sync title and name before save
propertySchema.pre("save", function () {
  if (!this.title && this.name) {
    this.title = this.name;
  } else if (!this.name && this.title) {
    this.name = this.title;
  }

  if (this.images && this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  } else if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
  }

  if (this.rating && !this.ratings) {
    this.ratings = this.rating;
  } else if (this.ratings && !this.rating) {
    this.rating = this.ratings;
  }

  // Parse city and area from location string if addressDetails is empty
  if (this.location && (!this.addressDetails || !this.addressDetails.city)) {
    const parts = this.location.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      this.addressDetails = {
        area: parts[0],
        city: parts[1],
        ...this.addressDetails,
      };
    } else if (parts.length === 1) {
      this.addressDetails = {
        city: parts[0],
        area: parts[0],
        ...this.addressDetails,
      };
    }
  }
});

// Indexes for high performance search and filtering
propertySchema.index({ name: "text", location: "text", description: "text" });
propertySchema.index({ price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ "addressDetails.city": 1 });
propertySchema.index({ isAvailable: 1, isFeatured: 1 });

const Property = mongoose.model("Property", propertySchema);

export default Property;
