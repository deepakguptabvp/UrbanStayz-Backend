import User from "../models/UserModel.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

/**
 * Helper to generate 6-digit OTP
 */
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res) => {
  const { fullName, name, email, phone, city, password, role } = req.body;
  const userName = fullName || name;

  if (!userName || !phone) {
    throw new ApiError(400, "Full name and phone number are required.");
  }

  // Check if phone number is already registered
  const existingPhone = await User.findOne({ phone: phone.trim() });
  if (existingPhone) {
    throw new ApiError(400, "Phone number is already registered. Please login.");
  }

  // Check email if provided
  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      throw new ApiError(400, "Email is already registered. Please use another email or login.");
    }
  }

  const user = await User.create({
    name: userName.trim(),
    email: email ? email.toLowerCase().trim() : undefined,
    phone: phone.trim(),
    city: city ? city.trim() : "",
    password: password || undefined,
    role: role || "user",
    isPhoneVerified: true,
  });

  const token = generateToken(user._id);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Send OTP to user phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim().length !== 10) {
    throw new ApiError(400, "Please enter a valid 10-digit mobile number.");
  }

  const cleanPhone = phone.trim();
  const otp = generate6DigitOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Find or create user record for phone
  let user = await User.findOne({ phone: cleanPhone });
  if (user) {
    user.otpCode = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });
  } else {
    // Pre-create placeholder user for fast OTP sign-in
    user = await User.create({
      name: `User_${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      otpCode: otp,
      otpExpires,
      isPhoneVerified: false,
    });
  }

  return res.status(200).json({
    success: true,
    message: `OTP sent successfully to +91 ${cleanPhone}`,
    otp, // In real production with Twilio/Fast2SMS, omit this in response
  });
});

/**
 * @desc    Verify OTP and log in / create session
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required.");
  }

  const cleanPhone = phone.trim();
  const user = await User.findOne({ phone: cleanPhone });

  if (!user) {
    throw new ApiError(404, "No account found for this phone number. Please request a new OTP.");
  }

  // Check OTP validity
  if (!user.otpCode || user.otpCode !== otp.trim()) {
    throw new ApiError(400, "Invalid OTP. Please check the code and try again.");
  }

  if (user.otpExpires && user.otpExpires < new Date()) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // Clear OTP code and mark verified
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.isPhoneVerified = true;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully. Logged in.",
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Password Login
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    throw new ApiError(400, "Please provide email/phone and password.");
  }

  const query = email
    ? { email: email.toLowerCase().trim() }
    : { phone: phone.trim() };

  const user = await User.findOne(query).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid credentials. Please check your login details.");
  }

  const token = generateToken(user._id);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedProperties");

  return ApiResponse.success(res, user, "User profile retrieved");
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, city, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name) user.name = name.trim();
  if (email) user.email = email.toLowerCase().trim();
  if (city) user.city = city.trim();
  if (avatar) user.avatar = avatar;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Toggle saved / bookmarked property
 * @route   POST /api/auth/bookmark/:propertyId
 * @access  Private
 */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const user = await User.findById(req.user._id);

  const isSaved = user.savedProperties.includes(propertyId);

  if (isSaved) {
    user.savedProperties = user.savedProperties.filter(
      (id) => id.toString() !== propertyId
    );
  } else {
    user.savedProperties.push(propertyId);
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: isSaved ? "Property removed from bookmarks" : "Property bookmarked",
    savedProperties: user.savedProperties,
  });
});
