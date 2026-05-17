const express = require("express");

const router = express.Router();

const {

  registerUser,

  verifyRegistration,

  resendRegistrationCode,

  loginUser

} = require("../controllers/userAuthController");

router.post("/register", registerUser);

router.post("/verify-registration", verifyRegistration);

router.post("/resend-registration-code", resendRegistrationCode);

router.post("/login", loginUser);

module.exports = router;
