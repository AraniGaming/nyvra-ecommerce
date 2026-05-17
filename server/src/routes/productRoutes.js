const express = require("express");
const router = express.Router();
const Product = require("../models/productModel"); // 👈 Injected to handle the featured pipeline inline

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const cleanProductName = (name = "") => {
  const normalizedName = String(name).replace(/\s+/g, " ").trim();

  return normalizedName
    .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\+\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, "")
    .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\/\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, "")
    .replace(/\s+\d+\s*GB\s*(?:RAM)?$/i, "")
    .trim() || normalizedName;
};

// =========================================================================
// 📑 FETCH ONLY FEATURED PRODUCTS (Must stay ABOVE /:id parameter catchers)
// =========================================================================
router.get("/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });
    res.status(200).json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Failed to sync featured pipeline", error: error.message });
  }
});

// GET ALL + CREATE
router.route("/")
  .get(getProducts)
  .post(createProduct);

// =========================================================================
// ⚡ INSTANT TOGGLE FEATURED STATUS (Admin panel star mechanism target)
// =========================================================================
router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Asset not found" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({ message: "Featured profile shifted", isFeatured: product.isFeatured });
  } catch (error) {
    res.status(500).json({ message: "Toggle operations mutation failed", error: error.message });
  }
});

// GET ALL CONFIGURATION VARIANTS FOR A SINGLE MODEL
router.get("/:id/variants", async (req, res) => {
  try {
    const selectedProduct = await Product.findById(req.params.id);

    if (!selectedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const selectedBaseName = cleanProductName(selectedProduct.name);
    const products = await Product.find({
      brand: selectedProduct.brand,
      category: selectedProduct.category
    });

    const variantMap = new Map();

    products
      .filter((product) => cleanProductName(product.name) === selectedBaseName)
      .forEach((product) => {
        const configurationKey = `${product.ram}|${product.storage}`;
        const currentVariant = variantMap.get(configurationKey);

        if (!currentVariant || product.price < currentVariant.price) {
          variantMap.set(configurationKey, product);
        }
      });

    const variants = [...variantMap.values()]
      .sort((a, b) => {
        if (a.ram !== b.ram) return a.ram - b.ram;
        if (a.storage !== b.storage) return a.storage - b.storage;
        return a.price - b.price;
      });

    res.status(200).json({
      baseName: selectedBaseName,
      selectedId: selectedProduct._id,
      variants
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load product variants",
      error: error.message
    });
  }
});

// GET SINGLE + UPDATE + DELETE
router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
