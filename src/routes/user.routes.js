const express = require('express');
const router = express.Router();
const { authUserMiddleware } = require('../middlewares/authMiddleware');
const { getUserProfile, updateUserStats, resetUserStats, updateUserProfile, uploadProfilePhoto, createOrder, getUserOrders, logoutUser, getFoodVideos, updateLikes, addToCart, getCart, updateCart, removeFromCart, clearCart, followRestaurant, favoriteRestaurant, getFavorites, getFollowing } = require('../controllers/userController');
const { rateOrder } = require('../controllers/orderController');


// User profile routes
router.get('/profile', authUserMiddleware, getUserProfile);
router.post('/update-stats', updateUserStats);
router.post('/reset-stats', resetUserStats);
router.put('/update-profile', authUserMiddleware, updateUserProfile);
router.post('/upload-profile-photo', authUserMiddleware, uploadProfilePhoto);
router.post('/orders', authUserMiddleware, createOrder);
router.get('/orders', authUserMiddleware, getUserOrders);
router.post('/orders/:orderId/rate', authUserMiddleware, rateOrder);
router.post('/logout', logoutUser);
router.post('/food-videos', authUserMiddleware, getFoodVideos);
router.post('/update-likes', authUserMiddleware, updateLikes);
router.post('/add-to-cart', authUserMiddleware, addToCart);
router.get('/cart', authUserMiddleware, getCart);
router.post('/update-cart', authUserMiddleware, updateCart);
router.post('/remove-from-cart', authUserMiddleware, removeFromCart);
router.post('/clear-cart', authUserMiddleware, clearCart);
router.post('/follow-restaurant', authUserMiddleware, followRestaurant);
router.post('/favorite-restaurant', authUserMiddleware, favoriteRestaurant);
router.get('/favorites', authUserMiddleware, getFavorites);
router.get('/following', authUserMiddleware, getFollowing);

module.exports = router;
