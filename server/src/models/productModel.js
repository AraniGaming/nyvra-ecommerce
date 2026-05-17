const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ✅ BASIC INFO
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },

    // ✅ TECH SPECS
    ram: { type: Number, required: true },
    storage: { type: Number, required: true },
    battery: { type: Number, required: true },
    chargingSpeed: { type: Number },
    refreshRate: { type: Number },
    processor: { type: String, required: true },
    processorTier: {
      type: String,
      enum: ["entry", "midrange", "upper-midrange", "flagship"],
      required: true
    },

    // ✅ SMART RECOMMENDATION SCORES (1 - 100)
    gamingScore: { type: Number, min: 1, max: 100, default: 50 },
    cameraScore: { type: Number, min: 1, max: 100, default: 50 },
    batteryScore: { type: Number, min: 1, max: 100, default: 50 },
    performanceScore: { type: Number, min: 1, max: 100, default: 50 },
    displayScore: { type: Number, min: 1, max: 100, default: 50 },
    designScore: { type: Number, min: 1, max: 100, default: 50 },
    valueScore: { type: Number, min: 1, max: 100, default: 50 },

    // ✅ USER SEGMENT
    idealFor: [{ type: String }],

    // ✅ PRICE SEGMENT
    priceSegment: {
      type: String,
      enum: ["budget", "midrange", "premium", "ultra-premium"],
      required: true
    },

    // ✅ HOMEPAGE SHOWCASE PROMOTION
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;