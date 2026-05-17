const User = require("../models/userModel");


// ✅ GET WISHLIST
const getWishlist = async (req, res) => {

  try {

    const user = await User.findById(req.user._id)
      .populate("wishlist");

    res.json((user.wishlist || []).filter(Boolean));

  }

  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// ✅ ADD TO WISHLIST
const addToWishlist = async (req, res) => {

  try {

    const user =
      await User.findById(req.user._id);

    const productId =
      req.params.productId;

    const exists =
      user.wishlist.some(

        item =>
          item.toString() === productId

      );

    if (!exists) {

      user.wishlist.push(productId);

      await user.save();

    }

    res.json({
      message: "Added to wishlist"
    });

  }

  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// ✅ REMOVE FROM WISHLIST
const removeFromWishlist = async (req, res) => {

  try {

    const user =
      await User.findById(req.user._id);

    const productId =
      req.params.productId;

    user.wishlist = user.wishlist.filter(

      item =>
        item.toString() !== productId

    );

    await user.save();

    res.json({
      message: "Removed from wishlist"
    });

  }

  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


module.exports = {

  getWishlist,

  addToWishlist,

  removeFromWishlist

};
