const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// user routes
router.post("/user/register",authController.registerUser);
router.post("/user/login",authController.loginUser);
router.post("/user/logout",authController.logoutUser);

// food partner routes
router.post("/food-partner/register",authController.registerPartner);
router.post("/food-partner/login",authController.loginPartner);
router.post("/food-partner/logout",authController.logoutPartner);

module.exports = router;
