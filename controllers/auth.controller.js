import ms from "ms";
import ErrorResponse from "../utils/errorResponse.js";
import sendEmail from "../services/email.service.js";
import User from "../models/User.js";

export const register = async (req, res, next) => {
  const { name, email, password, bloodType, phone, state, lga } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse("Email already registered", 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      bloodType,
      phone,
      state,
      lga,
    });

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verify/${verificationToken}`;

    console.log(verificationUrl);
    await sendEmail({
      email: user.email,
      subject: "Verify Your Email",
      message: `Please verify your email by clicking: ${verificationUrl}`,
    });

    res.status(201).json({
      success: true,
      token: user.getSignedJwtToken(),
      verificationUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const registerStaff = async (req, res, next) => {
  const { name, email, password, bloodType, phone, role, state, lga } =
    req.body;

  try {
    if (role === "admin") {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists) {
        return next(new ErrorResponse("Admin already exists", 400));
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      bloodType,
      phone,
      role: "staff",
      state,
      lga,
    });

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verify/${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: "Verify Your Staff Account",
      message: `Please verify your staff account: ${verificationUrl}`,
    });

    res.status(201).json({
      success: true,
      token: user.getSignedJwtToken(),
      verificationUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  if (!user.isVerified) {
    return next(new ErrorResponse("Please verify your email first", 401));
  }

  sendTokenResponse(user, 200, res);
};

export const loginStaff = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  if (!user.isVerified) {
    return next(new ErrorResponse("Please verify your email first", 401));
  }

  if (user.role !== "admin" && user.role !== "staff") {
    return next(new ErrorResponse("Unauthorized access", 403));
  }

  sendTokenResponse(user, 200, res);
};

export const assignRole = async (req, res, next) => {
  const { userId, role } = req.body;

  try {
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return next(new ErrorResponse("Admin already exists", 400));
      }
    }

    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse("User not found", 404));

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "name email role bloodType isAvailable location phone profilePic lastDonationDate isVerified verified createdAt updatedAt"
  );

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const getStaff = async (req, res, next) => {
  try {
    const staffMembers = await User.find({ role: "staff" });

    if (!staffMembers.length) {
      return next(new ErrorResponse("No staff found", 404));
    }

    res.status(200).json({
      success: true,
      data: staffMembers,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
    };

    if (req.user.role === "donor") {
      fieldsToUpdate.bloodType = req.body.bloodType;
      fieldsToUpdate.isAvailable = req.body.isAvailable;
    }

    if (req.file && req.file.path) {
      fieldsToUpdate.profilePic = req.file.path;
    }

    // Check if email is being updated
    if (req.body.email) {
      const emailOwner = await User.findOne({ email: req.body.email });

      if (emailOwner && emailOwner._id.toString() !== req.user.id) {
        return next(new ErrorResponse("Email already in use", 400));
      }

      fieldsToUpdate.email = req.body.email;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};

const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const expiresIn = process.env.JWT_EXPIRE || "1d";
  const expirationDate = new Date(Date.now() + ms(expiresIn));

  const options = {
    expires: expirationDate,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};
