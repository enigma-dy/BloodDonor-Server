import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please provide email"],
      validate: {
        validator: validator.isEmail,
        message: "Please provide valid email",
      },
      lowercase: true,
      trim: true,
    },
    lastDonationDate: {
      type: Date,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "donor", "hospital", "recipient", "staff"],
      default: "donor",
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: function () {
        return this.role === "donor";
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              !isNaN(coords[0]) &&
              !isNaN(coords[1]) &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid coordinates",
        },
      },
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
      validate: {
        validator: function (v) {
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Invalid phone number",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verified: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.verificationToken = verificationToken;
  return verificationToken;
};

export default mongoose.model("User", UserSchema);
