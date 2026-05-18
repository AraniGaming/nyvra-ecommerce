const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const protectAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin authorization required" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin account not found" });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid admin session" });
  }
};

module.exports = {
  protectAdmin
};
