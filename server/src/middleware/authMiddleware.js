const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      // Core authentication succeeded, proceed to next route handler
      return next();

    } catch (error) {
      res.status(401);
      // Pipelined safely to your global error handler middleware
      return next(new Error("Not authorized"));
    }
  }

  if (!token) {
    res.status(401);
    // Pipelined safely to your global error handler middleware
    return next(new Error("No token"));
  }
};

module.exports = {
  protect
};