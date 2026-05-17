require("dotenv").config();

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const Admin = require("./models/adminModel");

connectDB();

const createAdmin = async () => {

  try {

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {

      console.error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD before creating an admin."
      );

      process.exit(1);

    }

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      10
    );

    let admin = await Admin.findOne();

    if (admin) {

      admin.email = adminEmail;
      admin.password = hashedPassword;

      await admin.save();

      await Admin.deleteMany({
        _id: {
          $ne: admin._id
        }
      });

    } else {

      admin = await Admin.create({
        email: adminEmail,
        password: hashedPassword
      });

    }

    console.log(`Admin ready: ${admin.email}`);

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit(1);

  }

};

createAdmin();
