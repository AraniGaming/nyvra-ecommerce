const express = require("express");

const router = express.Router();

const {
  loginAdmin,
  createAdmin
} = require("../controllers/authController");

const {
  protectAdmin
} = require("../middleware/adminAuthMiddleware");

router.post("/login", loginAdmin);

router.post("/admins", protectAdmin, createAdmin);

module.exports = router;
