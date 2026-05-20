const Product = require("../models/productModel");

const PRODUCT_FIELDS = [
  "name",
  "brand",
  "model",
  "variantName",
  "price",
  "availabilityStatus",
  "condition",
  "launchYear",
  "image",
  "category",
  "stock",
  "description",
  "ram",
  "storage",
  "battery",
  "chargingSpeed",
  "refreshRate",
  "displaySize",
  "rearCameraMP",
  "rearCameraDetails",
  "frontCameraMP",
  "processor",
  "processorTier",
  "processorFabrication",
  "network",
  "displayType",
  "displayResolution",
  "brightness",
  "os",
  "uiSkin",
  "uiVersion",
  "biometricSecurity",
  "speaker",
  "waterproof",
  "videoRecording",
  "gamingScore",
  "cameraScore",
  "batteryScore",
  "performanceScore",
  "displayScore",
  "designScore",
  "valueScore",
  "priceSegment",
  "idealFor",
  "isFeatured"
];

const NUMBER_FIELDS = new Set([
  "price",
  "launchYear",
  "stock",
  "ram",
  "storage",
  "battery",
  "chargingSpeed",
  "refreshRate",
  "displaySize",
  "rearCameraMP",
  "frontCameraMP",
  "gamingScore",
  "cameraScore",
  "batteryScore",
  "performanceScore",
  "displayScore",
  "designScore",
  "valueScore"
]);

const FIELD_ALIASES = {
  catagory: "category",
  varientName: "variantName",
  uiVerson: "uiVersion"
};

const normalizeText = (value) => {
  return typeof value === "string"
    ? value.trim()
    : value;
};

const buildName = (payload) => {
  return [
    payload.brand,
    payload.model,
    payload.variantName
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
};

const normalizeProductPayload = (body = {}, options = {}) => {
  const { applyDefaults = false } = options;
  const source = { ...body };

  Object.entries(FIELD_ALIASES).forEach(([alias, target]) => {
    if (source[alias] !== undefined && source[target] === undefined) {
      source[target] = source[alias];
    }
  });

  const payload = {};

  PRODUCT_FIELDS.forEach((field) => {
    if (source[field] === undefined) {
      return;
    }

    let value = normalizeText(source[field]);

    if (field === "idealFor") {
      value = Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    }

    if (NUMBER_FIELDS.has(field)) {
      value = value === "" || value === null
        ? undefined
        : Number(value);
    }

    if (field === "network" && typeof value === "string") {
      const normalizedNetwork = value.toLowerCase();
      value = normalizedNetwork === "5g"
        ? "5G"
        : normalizedNetwork === "4g"
          ? "4G"
          : normalizedNetwork === "lte"
            ? "LTE"
            : normalizedNetwork === "4g/5g"
              ? "4G/5G"
              : value;
    }

    if (value !== undefined) {
      payload[field] = value;
    }
  });

  if (applyDefaults) {
    payload.brand = payload.brand || "Unknown";
    payload.category = payload.category || "smartphone";
    payload.name = payload.name || buildName(payload) || "Unnamed Product";
    payload.description = payload.description || [
      payload.processor,
      payload.ram ? `${payload.ram}GB RAM` : "",
      payload.storage ? `${payload.storage}GB Storage` : ""
    ].filter(Boolean).join(", ");
  } else if (!payload.name && (payload.brand || payload.model || payload.variantName)) {
    payload.name = buildName(payload);
  }

  return payload;
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const product = new Product(normalizeProductPayload(req.body, { applyDefaults: true }));

    const createdProduct = await product.save();

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    Object.assign(product, normalizeProductPayload(req.body));

    const updatedProduct = await product.save();

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await product.deleteOne();

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
