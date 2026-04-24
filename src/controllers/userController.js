const mongoose = require('mongoose');
const UserModel = require('../models/User.model');
const OrderModel = require('../models/Order.model');
const FoodModel = require('../models/Food.model');
const FoodPartnerModel = require('../models/FoodPartner.model');

const updateUserStats = async (req, res) => {
  try {
      
    // Find the user (for demo, we'll update the first user)
    const user = await UserModel.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }


    // Increment orders count
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $inc: { 
          orders: 1  // Increment order count by 1
        }
      },
      { new: true } // Return the updated document
    );


    res.status(200).json({
      success: true,
      message: 'User stats updated successfully',
      user: {
        orders: updatedUser.orders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Calculate user stats from database
    const orderCount = user.orders || 0; // Real orders from database
    const favoriteCount = user.likes ? user.likes.length : 0;
    const points = user.points || 0; // Real points from database

    // Ensure we get fresh data from database
    const freshUser = await UserModel.findById(user._id);
    if (freshUser) {
      Object.assign(user, freshUser.toObject());
    }
    
    // Format addresses from user data
    const addresses = user.address ? [{
      id: 1,
      type: 'Home',
      address: user.address
    }] : [];

    const userProfileData = {
      name: user.name || 'Demo User',
      email: user.email || 'demo@example.com',
      phone: user.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : '+91 XXXXX XXXXX',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      location: user.city && user.state ? `${user.city}, ${user.state}` : 'Jaipur, Rajasthan', // Dynamic location
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
      gender: 'Not specified',
      dob: 'Not specified',
      avatar: user.profilePhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user.name ? user.name.replace(/\s+/g, '') : 'demo'),
      profilePhoto: user.profilePhoto || '', // Added profilePhoto field
      orders: orderCount,
      favorites: user.favorites || [], // Return the actual array, not count
      following: user.following || [], // Return the following array
      points: points,
      addresses: addresses
    };


    res.status(200).json({
      success: true,
      user: userProfileData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const resetUserStats = async (req, res) => {
  try {
    
    // Find the user (for demo, we'll update the first user)
    const user = await UserModel.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset orders and points to 0
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        orders: 0,
        points: 0
      },
      { new: true }
    );


    res.status(200).json({
      success: true,
      message: 'User stats reset successfully',
      user: {
        orders: updatedUser.orders,
        points: updatedUser.points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file size (max 5MB for profile photos)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    // Convert file to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const profilePhotoUrl = `data:${mimeType};base64,${base64Image}`;
    
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Update user profile with the base64 image
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { profilePhoto: profilePhotoUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhoto: profilePhotoUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Use orderId from request body or generate one
    const orderId = req.body.orderId || 'FOD-' + Date.now().toString().slice(-6);

    // Get order details from request
    const restaurantName = req.body.restaurant?.name || 'Demo Restaurant';
    const totalAmount = req.body.totalAmount || 100;

    // Extract restaurantId from nested restaurant object
    const { restaurant } = req.body;
    const restaurantId = restaurant?.restaurantId;

    // Validate restaurantId
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: restaurant.restaurantId'
      });
    }

    // Create new order
    const newOrder = new OrderModel({
      user: user._id,
      orderId: orderId,
      restaurant: req.body.restaurant || {
        name: 'Demo Restaurant',
        address: '123 Demo Street, Demo City'
      },
      items: req.body.items || [{
        name: 'Demo Food',
        quantity: 1,
        price: 100,
        image: ''
      }],
      totalAmount: totalAmount,
      deliveryAddress: req.body.deliveryAddress || '123 Demo Address',
      status: 'Confirmed',
      estimatedTime: '35-40 mins',
      paymentMethod: req.body.paymentMethod || 'COD'
    });

    const savedOrder = await newOrder.save();

    // Update FoodPartner's totalIncome
    await FoodPartnerModel.findByIdAndUpdate(
      restaurantId,
      { $inc: { totalIncome: totalAmount } }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find all orders for this user, sorted by date (newest first)
    const orders = await OrderModel.find({ user: user._id })
      .sort({ orderDate: -1 });


    // If no orders found, return empty array with success
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
        message: 'No orders found'
      });
    }

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      restaurant: order.restaurant,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      estimatedTime: order.estimatedTime,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      totalOrders: orders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    
    // Get user from auth middleware
    let user = req.user;
    
    // Check if we have userId in query params for demo mode
    const { userId } = req.query;
    
    if (!user && userId) {
      // Demo mode: find user based on userId
      user = await UserModel.findOne({ email: `${userId}@demo.local` });
    } else if (!user) {
      // Demo mode: identify user by email from request body
      const userEmail = req.body.email;
      if (userEmail) {
        user = await UserModel.findOne({ email: userEmail });
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please ensure user exists in database.'
        });
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle profile photo - check if it's base64 data
    let profilePhotoToUpdate = user.profilePhoto;
    if (req.body.profilePhoto && req.body.profilePhoto.startsWith('data:image/')) {
      profilePhotoToUpdate = req.body.profilePhoto;
    } else if (req.body.profilePhoto) {
      profilePhotoToUpdate = req.body.profilePhoto;
    }

    // Update user profile with form data
    const updateData = {
      name: req.body.name || user.name,
      phone: req.body.phone || user.phone || '', // Ensure phone is always included
      address: req.body.address || user.address,
      city: req.body.city || user.city, // New field
      state: req.body.state || user.state, // New field
      profilePhoto: profilePhotoToUpdate
    };
    
    // Don't update email field to avoid duplicate key issues
    // Email updates should be handled separately if needed
    
    // Use findOneAndUpdate with proper options to avoid duplicate key issues
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: updateData }, // Use $set operator to ensure fields are properly set
      { new: true, runValidators: false, upsert: false } // Disable validators to avoid duplicate key check on same doc
    );
    
    

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city, // New field
        state: updatedUser.state, // New field
        profilePhoto: updatedUser.profilePhoto,
        orders: updatedUser.orders,
        joinDate: updatedUser.createdAt ? new Date(updatedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'
      }
    });
  } catch (error) {
    // Handle cast errors (like phone number type issues)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid data format: ${error.message}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    
    // For this demo, we'll just send a success response
    // In a real app, you might:
    // - Clear session data
    // - Clear JWT tokens from database
    // - Clear refresh tokens
    // - Add token to blacklist
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: error.message
    });
  }
};

const updateLikes = async (req, res) => {
  try {
    const { foodId, increment, userId } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find the food item
    const food = await FoodModel.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Initialize likes array if it doesn't exist
    if (!user.likes) {
      user.likes = [];
    }
    
    // Check if user has already liked this food item
    const hasLiked = user.likes.some(likedFoodId => likedFoodId.toString() === foodId);
    
    if (increment && !hasLiked) {
      // Add like: add to user's likes array and increment food's likes count
      user.likes.push(foodId);
      food.likes = (food.likes || 0) + 1;
      await user.save();
      await food.save();
    } else if (!increment && hasLiked) {
      // Remove like: remove from user's likes array and decrement food's likes count
      user.likes = user.likes.filter(likedFoodId => likedFoodId.toString() !== foodId);
      food.likes = Math.max(0, (food.likes || 0) - 1);
      await user.save();
      await food.save();
    }
    
    res.status(200).json({
      success: true,
      likes: food.likes,
      isLiked: increment ? true : false,
      message: `Likes ${increment ? 'increased' : 'decreased'} successfully`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating likes',
      error: error.message
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { foodId, quantity = 1 } = req.body;
    
    // Find the food item
    const food = await FoodModel.findById(foodId).populate('foodPartnerId', 'restaurantName address');
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Find user (for demo, we'll use the first user)
    const user = await UserModel.findOne();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = user.cart?.findIndex(item => item.foodId.toString() === foodId);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      const cartItem = {
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity: quantity,
        image: food.image,
        restaurant: food.foodPartnerId?.restaurantName || 'Restaurant',
        restaurantId: food.foodPartnerId?._id,
        isVeg: food.isVeg,
        category: food.category
      };
      
      if (!user.cart) user.cart = [];
      user.cart.push(cartItem);
    }
    
    await user.save();
    
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: user.cart,
      totalItems: user.cart.reduce((sum, item) => sum + item.quantity, 0)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding to cart',
      error: error.message
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { foodId } = req.body;
    
    // Find user (for demo, we'll use the first user)
    const user = await UserModel.findOne();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove item from cart
    if (user.cart) {
      user.cart = user.cart.filter(item => item.foodId.toString() !== foodId);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: user.cart,
      totalItems: user.cart.reduce((sum, item) => sum + item.quantity, 0)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing from cart',
      error: error.message
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const { foodId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find the item in cart
    const existingItemIndex = user.cart?.findIndex(item => item.foodId.toString() === foodId);
    
    if (existingItemIndex >= 0) {
      // Update quantity directly
      user.cart[existingItemIndex].quantity = quantity;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Cart updated successfully',
        cart: user.cart,
        totalItems: user.cart.reduce((sum, item) => sum + item.quantity, 0)
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating cart',
      error: error.message
    });
  }
};

const followRestaurant = async (req, res) => {
  try {
    const { restaurantId, userId } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Initialize following array if it doesn't exist
    if (!user.following) {
      user.following = [];
      await user.save(); // Save to ensure the field is added to the document
    }

    // Filter out any null values from following array
    user.following = user.following.filter(id => id != null);
    
    // Check if already following
    const isFollowing = user.following.some(id => id.toString() === restaurantId);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(id => id.toString() !== restaurantId);
    } else {
      // Follow - only add if restaurantId is valid
      if (restaurantId && restaurantId.toString() !== 'null') {
        user.following.push(restaurantId);
      }
    }

    await user.save();
    
    res.status(200).json({
      success: true,
      message: isFollowing ? 'Restaurant unfollowed successfully' : 'Restaurant followed successfully',
      isFollowing: !isFollowing,
      followingCount: user.following.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while following/unfollowing',
      error: error.message
    });
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Filter out null values from following array
    const followingIds = (user.following || []).filter(id => id != null);
    
    // Fetch restaurant details for each following ID
    const FoodPartnerModel = require('../models/FoodPartner.model');
    const followingRestaurants = await FoodPartnerModel.find({
      _id: { $in: followingIds }
    }).select('restaurantName image rating cuisine address city');
    
    res.status(200).json({
      success: true,
      following: followingRestaurants
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching following',
      error: error.message
    });
  }
};

const favoriteRestaurant = async (req, res) => {
  try {
    const { restaurantId, userId } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
      await user.save(); // Save to ensure the field is added to the document
    }
    
    // Check if already favorited
    const isFavorited = user.favorites.some(id => id.toString() === restaurantId);
    
    if (isFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== restaurantId);
    } else {
      // Add to favorites
      user.favorites.push(restaurantId);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: isFavorited ? 'Restaurant removed from favorites' : 'Restaurant added to favorites',
      isFavorited: !isFavorited,
      favoritesCount: user.favorites.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while favoriting restaurant',
      error: error.message
    });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
      await user.save();
    }
    
    // Fetch favorite restaurants details
    const favoriteRestaurants = await FoodPartnerModel.find({
      _id: { $in: user.favorites }
    }).select('restaurantName image cuisine rating time price address city');
    
    // Transform data for frontend
    const favorites = favoriteRestaurants.map(restaurant => ({
      _id: restaurant._id,
      name: restaurant.restaurantName,
      image: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600',
      cuisine: restaurant.cuisine || 'Multi Cuisine',
      rating: restaurant.rating || '4.0',
      time: restaurant.time || '30 min',
      price: restaurant.price || 'Rs 500 for two',
      address: restaurant.address,
      city: restaurant.city,
      distance: '2.5 km' // Mock distance for now
    }));
    
    res.status(200).json({
      success: true,
      favorites: favorites,
      count: favorites.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching favorites',
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Clear cart
    user.cart = [];
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: [],
      totalItems: 0
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getCart = async (req, res) => {
  try {
    // For demo, we'll get the first user
    // In a real app, you'd get user ID from JWT token
    const user = await UserModel.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has no cart, return empty array
    if (!user.cart || user.cart.length === 0) {
      return res.status(200).json({
        success: true,
        cart: [],
        message: 'Cart is empty'
      });
    }

    // Return the user's cart
    res.status(200).json({
      success: true,
      cart: user.cart,
      totalItems: user.cart.reduce((sum, item) => sum + item.quantity, 0)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cart',
      error: error.message
    });
  }
};

const getFoodVideos = async (req, res) => {
  try {
    const user = req.user; // May be undefined for unauthenticated users

    // Find all foods that have reels (isReel: true) and populate restaurant info
    // Use a more lenient query to avoid errors
    let foodVideos = [];
    try {
      foodVideos = await FoodModel.find({ isReel: true, videoUrl: { $ne: "" } })
        .populate('foodPartnerId', 'restaurantName address')
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for better performance and to avoid Mongoose document issues
    } catch (populateError) {
      // Fallback: try without populate
      try {
        foodVideos = await FoodModel.find({ isReel: true, videoUrl: { $ne: "" } })
          .sort({ createdAt: -1 })
          .lean();
      } catch (queryError) {
        foodVideos = [];
      }
    }
    
    
    // Format the response to match the frontend expected format
    let formattedVideos = foodVideos.map(food => {
      // Check if current user has liked this food item
      const isLiked = user && user.likes ? 
        user.likes.some(likedFoodId => likedFoodId.toString() === food._id.toString()) : 
        false;
      
      // Check if current user is following this restaurant
      const restaurantId = food.foodPartnerId?._id?.toString();
      const isFollowing = user && user.following ? 
        user.following.some(followingId => followingId?.toString() === restaurantId) : 
        false;
      
      // Check if current user has this food item in cart
      const isInCart = user && user.cart ? 
        user.cart.some(cartItem => cartItem.foodId?.toString() === food._id.toString()) : 
        false;
        
      return {
        id: food._id,
        restaurantId: restaurantId,
        url: food.videoUrl,
        restaurant: food.foodPartnerId?.restaurantName || 'Restaurant',
        dish: food.name,
        price: `₹${food.price}`,
        rating: '4.5', // Default rating since Food model doesn't have rating
        category: food.cuisineType || 'Other',
        description: food.description || '',
        thumbnailUrl: food.image,
        likes: food.likes || 0, // Include actual likes from database
        isLiked: isLiked, // Include user-specific like status
        isFollowing: isFollowing, // Include user-specific follow status
        isInCart: isInCart // Include user-specific cart status
      };
    });
    
    // Always provide sample videos for testing and when no real data exists
    if (formattedVideos.length === 0) {
      formattedVideos = [
        {
          id: 'sample1',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-sushi-rolls-on-a-plate-41135-large.mp4',
          restaurant: 'Sagar Ratna',
          dish: 'Premium Sushi Platter',
          price: '₹899',
          rating: '4.8',
          category: 'Continental',
          description: 'Fresh sushi rolls with premium ingredients',
          thumbnailUrl: '',
          likes: 1245,
          isLiked: false
        },
        {
          id: 'sample2',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-honey-on-pancakes-with-blueberries-42936-large.mp4',
          restaurant: 'The Big Chill',
          dish: 'Blueberry Pancakes',
          price: '₹599',
          rating: '4.6',
          category: 'Continental',
          description: 'Fluffy pancakes with fresh blueberries and honey',
          thumbnailUrl: '',
          likes: 892,
          isLiked: false
        },
        {
          id: 'sample3',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-4736-large.mp4',
          restaurant: 'Starbucks',
          dish: 'Cappuccino',
          price: '₹299',
          rating: '4.5',
          category: 'Beverages',
          description: 'Rich and creamy cappuccino with perfect foam',
          thumbnailUrl: '',
          likes: 567,
          isLiked: false
        },
        {
          id: 'sample4',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-making-a-pizza-with-tomatoes-and-basil-39846-large.mp4',
          restaurant: 'Dominos',
          dish: 'Margherita Pizza',
          price: '₹449',
          rating: '4.7',
          category: 'Italian',
          description: 'Classic margherita pizza with fresh tomatoes and basil',
          thumbnailUrl: '',
          likes: 1523,
          isLiked: false
        },
        {
          id: 'sample5',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-grilling-a-steak-on-a-barbecue-39845-large.mp4',
          restaurant: 'Barbeque Nation',
          dish: 'Grilled Steak',
          price: '₹1299',
          rating: '4.9',
          category: 'Continental',
          description: 'Perfectly grilled steak with herbs and spices',
          thumbnailUrl: '',
          likes: 2103,
          isLiked: false
        }
      ];
    }

    res.status(200).json({
      success: true,
      videos: formattedVideos
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching food videos',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserStats,
  resetUserStats,
  updateUserProfile,
  uploadProfilePhoto,
  createOrder,
  getUserOrders,
  logoutUser,
  getFoodVideos,
  updateLikes,
  addToCart,
  getCart,
  updateCart,
  removeFromCart,
  clearCart,
  followRestaurant,
  favoriteRestaurant,
  getFavorites,
  getFollowing
};
