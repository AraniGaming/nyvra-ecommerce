const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const {
  randomInt
} = require("crypto");

const User = require("../models/userModel");

const PendingRegistration =
  require("../models/pendingRegistrationModel");

const {
  sendRegistrationOtp
} = require("../utils/emailService");

const OTP_EXPIRY_MINUTES = 10;

const REGISTRATION_EXPIRY_MINUTES = 30;

const RESEND_COOLDOWN_SECONDS = 60;

const MAX_OTP_ATTEMPTS = 5;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

const generateOtp = () =>
  randomInt(100000, 1000000).toString();

const getDateAfter = (amount, unit) => {
  const multiplier =
    unit === "seconds" ? 1000 : 60 * 1000;

  return new Date(Date.now() + amount * multiplier);
};

const buildToken = (user) => {
  return jwt.sign(
    {
      id: user._id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

// REGISTER USER
const registerUser = async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {

      return res.status(400).json({
        message: "Name, email, and password are required"
      });

    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {

      return res.status(400).json({
        message: "Enter a valid email address"
      });

    }

    if (String(password).length < 6) {

      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });

    }

    const userExists = await User.findOne({
      email: normalizedEmail
    });

    if (userExists) {

      return res.status(400).json({
        message: "User already exists"
      });

    }

    const existingPendingRegistration =
      await PendingRegistration.findOne({
        email: normalizedEmail
      });

    if (
      existingPendingRegistration &&
      existingPendingRegistration.resendAvailableAt.getTime() > Date.now()
    ) {

      const secondsRemaining =
        Math.ceil(
          (existingPendingRegistration.resendAvailableAt.getTime() - Date.now()) / 1000
        );

      return res.status(429).json({
        message: "Code already sent. Please wait before requesting another code.",
        resendAfterSeconds: secondsRemaining
      });

    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const otp =
      generateOtp();

    const otpHash =
      await bcrypt.hash(
        otp,
        10
      );

    const pendingRegistration =
      await PendingRegistration.findOneAndUpdate(
        {
          email: normalizedEmail
        },
        {
          $set: {
            name: String(name).trim(),
            email: normalizedEmail,
            passwordHash: hashedPassword,
            otpHash,
            otpExpiresAt: getDateAfter(OTP_EXPIRY_MINUTES, "minutes"),
            resendAvailableAt: getDateAfter(RESEND_COOLDOWN_SECONDS, "seconds"),
            attempts: 0,
            expiresAt: getDateAfter(REGISTRATION_EXPIRY_MINUTES, "minutes")
          },
          $inc: {
            sendCount: 1
          }
        },
        {
          returnDocument: "after",
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

    let emailResult;

    try {
      emailResult = await sendRegistrationOtp({
        email: normalizedEmail,
        name: String(name).trim(),
        otp
      });
    } catch (emailError) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id
      });

      return res.status(502).json({
        message:
          emailError.publicMessage ||
          "Could not send verification email. Please try again.",
        details: emailError.message
      });
    }

    res.status(200).json({
      message: "Verification code sent",
      email: pendingRegistration.email,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
      deliveryMode: emailResult.deliveryMode
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// VERIFY REGISTRATION OTP
const verifyRegistration = async (req, res) => {

  try {

    const {
      email,
      otp
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedOtp =
      String(otp || "").trim();

    if (
      !normalizedEmail ||
      !EMAIL_PATTERN.test(normalizedEmail) ||
      !/^\d{6}$/.test(normalizedOtp)
    ) {

      return res.status(400).json({
        message: "A valid 6 digit code is required"
      });

    }

    const pendingRegistration =
      await PendingRegistration.findOne({
        email: normalizedEmail
      });

    if (!pendingRegistration) {

      return res.status(404).json({
        message: "No pending registration found"
      });

    }

    if (pendingRegistration.otpExpiresAt.getTime() < Date.now()) {

      return res.status(400).json({
        message: "Verification code expired"
      });

    }

    if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {

      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new code."
      });

    }

    const isMatch =
      await bcrypt.compare(
        normalizedOtp,
        pendingRegistration.otpHash
      );

    if (!isMatch) {

      pendingRegistration.attempts += 1;

      await pendingRegistration.save();

      return res.status(400).json({
        message: "Invalid verification code",
        attemptsRemaining:
          Math.max(0, MAX_OTP_ATTEMPTS - pendingRegistration.attempts)
      });

    }

    const userExists =
      await User.findOne({
        email: normalizedEmail
      });

    if (userExists) {

      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id
      });

      return res.status(400).json({
        message: "User already exists"
      });

    }

    const user =
      await User.create({
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        password: pendingRegistration.passwordHash
      });

    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id
    });

    const token =
      buildToken(user);

    res.status(201).json({
      message: "Email verified",
      token,
      name: user.name,
      email: user.email
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// RESEND REGISTRATION OTP
const resendRegistrationCode = async (req, res) => {

  try {

    const normalizedEmail =
      normalizeEmail(req.body.email);

    if (!normalizedEmail) {

      return res.status(400).json({
        message: "Email is required"
      });

    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {

      return res.status(400).json({
        message: "Enter a valid email address"
      });

    }

    const userExists =
      await User.findOne({
        email: normalizedEmail
      });

    if (userExists) {

      return res.status(400).json({
        message: "User already exists"
      });

    }

    const pendingRegistration =
      await PendingRegistration.findOne({
        email: normalizedEmail
      });

    if (!pendingRegistration) {

      return res.status(404).json({
        message: "Start registration first"
      });

    }

    if (pendingRegistration.resendAvailableAt.getTime() > Date.now()) {

      const secondsRemaining =
        Math.ceil(
          (pendingRegistration.resendAvailableAt.getTime() - Date.now()) / 1000
        );

      return res.status(429).json({
        message: "Please wait before requesting another code",
        resendAfterSeconds: secondsRemaining
      });

    }

    const otp =
      generateOtp();

    const previousRegistrationState = {
      otpHash: pendingRegistration.otpHash,
      otpExpiresAt: pendingRegistration.otpExpiresAt,
      resendAvailableAt: pendingRegistration.resendAvailableAt,
      expiresAt: pendingRegistration.expiresAt,
      attempts: pendingRegistration.attempts,
      sendCount: pendingRegistration.sendCount
    };

    pendingRegistration.otpHash =
      await bcrypt.hash(
        otp,
        10
      );

    pendingRegistration.otpExpiresAt =
      getDateAfter(OTP_EXPIRY_MINUTES, "minutes");

    pendingRegistration.resendAvailableAt =
      getDateAfter(RESEND_COOLDOWN_SECONDS, "seconds");

    pendingRegistration.expiresAt =
      getDateAfter(REGISTRATION_EXPIRY_MINUTES, "minutes");

    pendingRegistration.attempts = 0;

    pendingRegistration.sendCount += 1;

    await pendingRegistration.save();

    let emailResult;

    try {
      emailResult = await sendRegistrationOtp({
        email: pendingRegistration.email,
        name: pendingRegistration.name,
        otp
      });
    } catch (emailError) {
      Object.assign(
        pendingRegistration,
        previousRegistrationState
      );

      await pendingRegistration.save();

      return res.status(502).json({
        message:
          emailError.publicMessage ||
          "Could not resend verification email. Please try again.",
        details: emailError.message
      });
    }

    res.json({
      message: "Verification code resent",
      email: pendingRegistration.email,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
      deliveryMode: emailResult.deliveryMode
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// LOGIN USER
const loginUser = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {

      return res.status(401).json({
        message: "Invalid Email"
      });

    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {

      return res.status(401).json({
        message: "Invalid Password"
      });

    }

    const token =
      buildToken(user);

    res.json({

      token,

      name: user.name,

      email: user.email

    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {

  registerUser,

  verifyRegistration,

  resendRegistrationCode,

  loginUser

};
