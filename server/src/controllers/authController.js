const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const Admin = require("../models/adminModel");


// LOGIN ADMIN
const loginAdmin = async (req, res) => {

  try {

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid Email"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      email: admin.email
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

const createAdmin = async (req, res) => {

  try {

    const { email, password } = req.body;

    const normalizedEmail =
      String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const existingAdmin =
      await Admin.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      return res.status(409).json({
        message: "Admin email already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const admin =
      await Admin.create({
        email: normalizedEmail,
        password: hashedPassword
      });

    res.status(201).json({
      message: "Admin account created",
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  loginAdmin,
  createAdmin
};
