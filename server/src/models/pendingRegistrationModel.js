const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    otpHash: {
      type: String,
      required: true
    },

    otpExpiresAt: {
      type: Date,
      required: true
    },

    resendAvailableAt: {
      type: Date,
      required: true
    },

    attempts: {
      type: Number,
      default: 0
    },

    sendCount: {
      type: Number,
      default: 0
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("PendingRegistration", pendingRegistrationSchema);
