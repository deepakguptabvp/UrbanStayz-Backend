import Property from "../models/PropertyModel.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Get all properties with advanced search, multi-field filtering, sorting & pagination
 * @route   GET /api/properties
 * @access  Public
 */
export const getAllProperties = asyncHandler(async (req, res) => {
  const {
    search,
    city,
    location,
    type,
    genderPreference,
    minPrice,
    maxPrice,
    amenities,
    furnishing,
    nearMetro,
    nearITPark,
    includedFood,
    sort,
    page = 1,
    limit = 50,
  } = req.query;

  // Build MongoDB query filter
  const filter = {};

  // 1. Search filter across name, location, and description
  const searchKeyword = search || city || location;
  if (searchKeyword && searchKeyword.trim() !== "") {
    const regex = new RegExp(searchKeyword.trim(), "i");
    filter.$or = [
      { name: regex },
      { title: regex },
      { location: regex },
      { "addressDetails.city": regex },
      { "addressDetails.area": regex },
      { description: regex },
    ];
  }

  // 2. Type / Gender preference filter
  if (type) {
    // Support comma-separated types or single type
    const typeList = type.split(",").map((t) => t.trim());
    filter.type = { $in: typeList.map((t) => new RegExp(`^${t}$`, "i")) };
  } else if (genderPreference) {
    filter.genderPreference = new RegExp(`^${genderPreference}$`, "i");
  }

  // 3. Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== "") {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      filter.price.$lte = Number(maxPrice);
    }
  }

  // 4. Amenities filter (comma-separated list e.g. "Wifi,AC Rooms,Gym")
  if (amenities) {
    const amenityArray = Array.isArray(amenities)
      ? amenities
      : amenities.split(",").map((a) => a.trim());
    if (amenityArray.length > 0) {
      filter.amenities = { $all: amenityArray };
    }
  }

  // 5. Furnishing
  if (furnishing) {
    filter.furnishing = new RegExp(`^${furnishing}$`, "i");
  }

  // 6. Boolean filters
  if (nearMetro === "true" || nearMetro === true) {
    filter.nearMetro = true;
  }
  if (nearITPark === "true" || nearITPark === true) {
    filter.nearITPark = true;
  }
  if (includedFood === "true" || includedFood === true) {
    filter.includedFood = true;
  }

  // 7. Sort options
  let sortOption = { createdAt: -1 };
  if (sort === "price_asc" || sort === "price_low_high") {
    sortOption = { price: 1 };
  } else if (sort === "price_desc" || sort === "price_high_low") {
    sortOption = { price: -1 };
  } else if (sort === "rating" || sort === "rating_desc") {
    sortOption = { rating: -1 };
  } else if (sort === "name_asc") {
    sortOption = { name: 1 };
  } else if (sort === "popular") {
    sortOption = { numReviews: -1, rating: -1 };
  }

  // 8. Pagination
  const pageNumber = Math.max(1, parseInt(page, 10));
  const limitNumber = Math.max(1, parseInt(limit, 10));
  const skip = (pageNumber - 1) * limitNumber;

  const total = await Property.countDocuments(filter);
  const properties = await Property.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  return res.status(200).json({
    success: true,
    count: properties.length,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber) || 1,
    data: properties,
  });
});

/**
 * @desc    Get top featured properties for Home page
 * @route   GET /api/properties/featured
 * @access  Public
 */
export const getFeaturedProperties = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 6;
  const properties = await Property.find({ isAvailable: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);

  return res.status(200).json({
    success: true,
    count: properties.length,
    data: properties,
  });
});

/**
 * @desc    Get property cities summary & stats
 * @route   GET /api/properties/stats/cities
 * @access  Public
 */
export const getCityStats = asyncHandler(async (req, res) => {
  const stats = await Property.aggregate([
    {
      $group: {
        _id: "$addressDetails.city",
        count: { $sum: 1 },
        minPrice: { $min: "$price" },
        avgPrice: { $avg: "$price" },
        sampleImage: { $first: "$imageUrl" },
      },
    },
    {
      $project: {
        city: "$_id",
        count: 1,
        minPrice: 1,
        avgPrice: { $round: ["$avgPrice", 0] },
        sampleImage: 1,
        _id: 0,
      },
    },
    { $sort: { count: -1 } },
  ]);

  return ApiResponse.success(res, stats, "City stats retrieved successfully");
});

/**
 * @desc    Get single property by ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    throw new ApiError(404, `Property not found with ID ${req.params.id}`);
  }

  // Also fetch 3 similar properties in the same city or category
  const similarProperties = await Property.find({
    _id: { $ne: property._id },
    $or: [
      { "addressDetails.city": property.addressDetails?.city },
      { type: property.type },
    ],
  }).limit(3);

  return res.status(200).json({
    success: true,
    data: property,
    similar: similarProperties,
  });
});

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Private (Owner/Admin)
 */
export const createProperty = asyncHandler(async (req, res) => {
  const propertyData = {
    ...req.body,
    ...(req.user ? { "owner.user": req.user._id } : {}),
  };

  const property = await Property.create(propertyData);

  return res.status(201).json({
    success: true,
    message: "Property created successfully",
    data: property,
  });
});

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private (Owner/Admin)
 */
export const updateProperty = asyncHandler(async (req, res) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    throw new ApiError(404, `Property not found with ID ${req.params.id}`);
  }

  // Update property
  property = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: "Property updated successfully",
    data: property,
  });
});

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private (Owner/Admin)
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    throw new ApiError(404, `Property not found with ID ${req.params.id}`);
  }

  await Property.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Property deleted successfully",
  });
});
