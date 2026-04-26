const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");

// Multer Configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', upload.fields([
  { name: "image", maxCount: 1 },
  { name: "videoFile", maxCount: 1 }
]), authMiddleware.authFoodPartnerMiddleware, foodController.createFood);
router.get("/", authMiddleware.authUserMiddleware, foodController.getFoods);
router.get("/restaurants", foodController.getRestaurants);
router.get("/dashboard", authMiddleware.authFoodPartnerMiddleware, foodController.getDashboardStats);
router.get('/menu/:restaurantId', foodController.getMenuByRestaurant);
router.get('/restaurant/:restaurantId', foodController.getRestaurantById);
router.get('/search', foodController.searchRestaurants);
router.get('/videos', foodController.getAllVideos);
router.get('/partner-videos', authMiddleware.authFoodPartnerMiddleware, foodController.getFoodPartnerVideos);
router.get("/profile", authMiddleware.authFoodPartnerMiddleware, foodController.getFoodPartnerProfile);
router.put("/profile", authMiddleware.authFoodPartnerMiddleware, foodController.updateFoodPartnerProfile);
router.get("/:foodId", authMiddleware.authFoodPartnerMiddleware, foodController.getFoodById);
router.delete('/:foodId', authMiddleware.authFoodPartnerMiddleware, foodController.deleteFood);
router.put('/:foodId', authMiddleware.authFoodPartnerMiddleware, foodController.updateFood);
module.exports = router;

// This file will contain routes related to food items, menu management, and interactions between users and food partners.