import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, "Please provide patient name"],
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    hospital: {
      type: mongoose.Schema.ObjectId,
      ref: "Hospital",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "fulfilled", "cancelled"],
      default: "open",
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
      },
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    fulfilledBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    fulfilledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

RequestSchema.index({ location: "2dsphere" });

const Request = mongoose.model("Request", RequestSchema);

export default Request;
