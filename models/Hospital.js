import mongoose from "mongoose";

const HospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide hospital name"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
    },
    address: {
      type: String,
      required: [true, "Please provide address"],
    },
    state: {
      type: String,
      required: [true, "Please provide state"],
    },
    city: {
      type: String,
      required: [true, "Please provide city"],
    },
    lga: {
      type: String,
      required: [true, "Please provide local government area (LGA)"],
    },
    bloodBank: {
      type: Map,
      of: Number,
      default: {
        "A+": 0,
        "A-": 0,
        "B+": 0,
        "B-": 0,
        "AB+": 0,
        "AB-": 0,
        "O+": 0,
        "O-": 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

HospitalSchema.index({ location: "2dsphere" });

const Hospital = mongoose.model("Hospital", HospitalSchema);
export default Hospital;
