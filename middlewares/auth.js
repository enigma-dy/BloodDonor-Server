import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import ErrorResponse from "../utils/errorResponse.js"; 
import crypto from "crypto";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse("No user found with this id", 404));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log("Allowed roles:", roles);
    console.log("User role:", req.user?.role);
    console.log("Type of user role:", typeof req.user?.role);

    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;

    // Hash the token to match the stored hash in the DB
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const user = await User.findOne({ 
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpire: { $gt: Date.now() } // Check if token hasn't expired
    });

    if (!user) {
      return next(new ErrorResponse("Invalid or expired verification token", 400));
    }

    // Clear the token and mark as verified
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    user.isVerified = true;
    user.verified = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    next(err);
  }
};