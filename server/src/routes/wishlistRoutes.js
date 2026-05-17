const express = require("express");

const router = express.Router();

const {

  getWishlist,

  addToWishlist,

  removeFromWishlist

} = require(
  "../controllers/wishlistController"
);

const {
  protect
} = require("../middleware/authMiddleware");

// GET
router.get(
  "/",
  protect,
  getWishlist
);

// ADD
router.post(
  "/:productId",
  protect,
  addToWishlist
);

// REMOVE
router.delete(
  "/:productId",
  protect,
  removeFromWishlist
);

module.exports = router;