const FoodPartnerModel = require("../models/FoodPartner.model");
const UserModel = require("../models/User.model");
const FoodModel = require("../models/Food.model");
const OrderModel = require("../models/Order.model");

// Get Food Partner Profile
const getFoodPartnerProfile = async (req, res) => {
  try {
    const foodPartner = req.foodPartner;
    
    if (!foodPartner) {
      return res.status(404).json({
        success: false,
        message: 'Food Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        restaurantName: foodPartner.restaurantName,
        ownerName: foodPartner.ownerName,
        email: foodPartner.email,
        phone: foodPartner.phone,
        address: foodPartner.address,
        city: foodPartner.city,
        state: foodPartner.state,
        image: foodPartner.image,
        isNightOpen: foodPartner.isNightOpen,
        isDineOutAvailable: foodPartner.isDineOutAvailable,
        isDeliveryAvailable: foodPartner.isDeliveryAvailable,
        isPureVeg: foodPartner.isPureVeg,
        cuisine: foodPartner.cuisine || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Restaurant By ID
const getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Find restaurant by ID
    const restaurant = await FoodPartnerModel.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        id: restaurant._id,
        name: restaurant.restaurantName,
        img: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600',
        rating: restaurant.rating || '4.0',
        location: restaurant.city || 'Jaipur',
        cuisine: restaurant.cuisine || 'Multi Cuisine',
        price: restaurant.price || 'Rs 500 for two',
        address: restaurant.address,
        isDineOutAvailable: restaurant.isDineOutAvailable || false,
        isPureVeg: restaurant.isPureVeg || false
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching restaurant',
      error: error.message
    });
  }
};

// Update Food Partner Profile
const updateFoodPartnerProfile = async (req, res) => {
  try {
    const foodPartner = req.foodPartner;
    
    if (!foodPartner) {
      return res.status(404).json({
        success: false,
        message: 'Food Partner not found'
      });
    }

    // Handle file upload
    let imageUrl = foodPartner.image; // Keep existing image by default
    const imageFile = req.files?.image?.[0];
    
    if (imageFile) {
      // Validate file size (max 5MB for restaurant logos)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (imageFile.size > maxSize) {
        return res.status(400).json({ message: "Image file size exceeds 5MB limit" });
      }
      
      // Convert image to base64
      try {
        const base64Image = imageFile.buffer.toString('base64');
        const mimeType = imageFile.mimetype;
        imageUrl = `data:${mimeType};base64,${base64Image}`;
      } catch (error) {
        return res.status(400).json({ message: "Failed to convert image to base64" });
      }
    } else if (req.body.imageUrl) {
      // If imageUrl is provided in form data (for existing URLs or base64)
      imageUrl = req.body.imageUrl;
    }

    // Parse other form fields (handle FormData)
    const restaurantName = req.body.restaurantName;
    const ownerName = req.body.ownerName;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const isNightOpen = req.body.isNightOpen === 'true' || req.body.isNightOpen === true;
    const isDineOutAvailable = req.body.isDineOutAvailable === 'true' || req.body.isDineOutAvailable === true;
    const isDeliveryAvailable = req.body.isDeliveryAvailable === 'true' || req.body.isDeliveryAvailable === true;
    const isPureVeg = req.body.isPureVeg === 'true' || req.body.isPureVeg === true;
    
    // Parse cuisine array from FormData
    let cuisine = foodPartner.cuisine || [];
    if (req.body.cuisine) {
      if (Array.isArray(req.body.cuisine)) {
        cuisine = req.body.cuisine;
      } else if (typeof req.body.cuisine === 'string') {
        try {
          cuisine = JSON.parse(req.body.cuisine);
        } catch {
          cuisine = req.body.cuisine.split(',').map(c => c.trim()).filter(c => c);
        }
      }
    }

    // Update food partner profile
    const updatedFoodPartner = await FoodPartnerModel.findByIdAndUpdate(
      foodPartner._id,
      {
        restaurantName: restaurantName || foodPartner.restaurantName,
        ownerName: ownerName || foodPartner.ownerName,
        email: email || foodPartner.email,
        phone: phone || foodPartner.phone,
        address: address || foodPartner.address,
        city: city || foodPartner.city,
        state: state || foodPartner.state,
        image: imageUrl,
        isNightOpen: isNightOpen !== undefined ? isNightOpen : foodPartner.isNightOpen,
        isDineOutAvailable: isDineOutAvailable !== undefined ? isDineOutAvailable : foodPartner.isDineOutAvailable,
        isDeliveryAvailable: isDeliveryAvailable !== undefined ? isDeliveryAvailable : foodPartner.isDeliveryAvailable,
        isPureVeg: isPureVeg !== undefined ? isPureVeg : foodPartner.isPureVeg,
        cuisine: cuisine || foodPartner.cuisine
      },
      { new: true, runValidators: true }
    );

    if (!updatedFoodPartner) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedFoodPartner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createFood = async (req, res) => {
  try {
    const foodPartner = req.foodPartner;
    const foodPartnerId = foodPartner._id;
    
    const { name, description, price, isVeg, cuisineType, category } = req.body;
    
    // Get files from multer
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.videoFile?.[0];

    // Validate required fields
    if (!name || !price || !imageFile) {
      return res.status(400).json({ 
        message: "Name, price, and image are required"
      });
    }

    // Validate file sizes
    const maxImageSize = 5 * 1024 * 1024; // 5MB for food images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for food videos (reels)
    
    if (imageFile.size > maxImageSize) {
      return res.status(400).json({ message: "Image file size exceeds 5MB limit" });
    }
    
    if (videoFile && videoFile.size > maxVideoSize) {
      return res.status(400).json({ message: "Video file size exceeds 50MB limit" });
    }

    // Convert image to base64
    let imageUrl = "";
    try {
      const base64Image = imageFile.buffer.toString('base64');
      const mimeType = imageFile.mimetype;
      imageUrl = `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      return res.status(400).json({ message: "Failed to convert image to base64" });
    }

    // Convert video to base64 (if provided)
    let videoUrl = "";
    try {
      if (videoFile) {
        const base64Video = videoFile.buffer.toString('base64');
        const mimeType = videoFile.mimetype;
        videoUrl = `data:${mimeType};base64,${base64Video}`;
      }
    } catch (error) {
      return res.status(400).json({ message: "Failed to convert video to base64" });
    }

    // Determine if it's a reel
    const isReel = videoUrl ? true : false;

    // Create new food item
    const newFood = await FoodModel.create({
      name,
      description: description || "",
      price: Number(price),
      isVeg: isVeg === "true" || isVeg === true || isVeg === "on",
      image: imageUrl,
      videoUrl: videoUrl,
      isReel: isReel,
      cuisineType: cuisineType || "",
      category: category || "Main Course",
      foodPartnerId: foodPartnerId,
    });

    // Add food to restaurant's menu
    await FoodPartnerModel.findByIdAndUpdate(foodPartnerId, {
      $push: { menu: newFood._id },
    });

    res.status(201).json({ 
      message: "Food item created successfully", 
      food: newFood 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const getFoods = async (req, res) => {
  try {
    const foods = await FoodModel.find().populate("foodPartnerId", "restaurantName");
    res.status(200).json({ foods });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const getFoodById = async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = await FoodModel.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.status(200).json({
      success: true,
      food
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const getRestaurants = async (req, res) => {
  try {
    const restaurants = await FoodPartnerModel.find()
      .select('restaurantName rating cuisine image isDeliveryAvailable isDineOutAvailable isNightOpen isPureVeg location')
      .lean();
    
    // Add mock delivery time and price for two (you can make these dynamic later)
    const restaurantsWithDetails = restaurants.map(restaurant => ({
      ...restaurant,
      time: '30 min', // Fixed delivery time
      price: 'Rs 500 for two', // Fixed price for two
      cuisine: restaurant.cuisine.join(', ')
    }));

    res.status(200).json({ restaurants: restaurantsWithDetails });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const foodPartner = req.foodPartner;
    
    // Get all food items for this partner
    const foods = await FoodModel.find({ foodPartnerId: foodPartner._id });
    
    // Fetch all orders for this restaurant
    const orders = await OrderModel.find({ 'restaurant.restaurantId': foodPartner._id });
    
    // Calculate real statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgRating = foodPartner.rating || 0;
    
    // Calculate live orders (orders that are not delivered or cancelled)
    const liveOrders = orders.filter(order => 
      order.status !== 'Delivered' && order.status !== 'Cancelled'
    ).length;
    
    // Get recent orders (last 5 orders)
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5)
      .map(order => ({
        id: order.orderId,
        items: `${order.items.length} items`,
        status: order.status,
        totalAmount: order.totalAmount,
        customer: order.user ? `Customer #${order.user.toString().slice(-4)}` : 'Guest'
      }));
    
    // Get all food items for the menu display
    const menuItems = foods.map(food => ({
      id: food._id,
      name: food.name,
      price: food.price,
      category: food.category || "Main Course",
      isVeg: food.isVeg,
      image: food.image,
      videoUrl: food.videoUrl,
      hasVideo: !!food.videoUrl
    }));

    res.status(200).json({
      stats: [
        { label: "Total Revenue", value: `Rs ${totalRevenue.toLocaleString()}`, icon: "TrendingUp", change: totalOrders > 0 ? "+12.5%" : "0%" },
        { label: "Live Orders", value: liveOrders.toString(), icon: "ShoppingBag", change: liveOrders > 0 ? "Active" : "No active orders" },
        { label: "Avg Rating", value: avgRating.toFixed(1), icon: "Star", change: avgRating > 0 ? "Top 5%" : "No rating" }
      ],
      menuItems,
      recentOrders,
      restaurantName: foodPartner.restaurantName
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// Search restaurants and food items
const searchRestaurants = async (req, res) => {
  try {
    // ... rest of the code remains the same ...
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    // Search for food partners (restaurants)
    const restaurants = await FoodPartnerModel.find({
      $or: [
        { restaurantName: searchRegex },
        { cuisine: searchRegex },
        { description: searchRegex }
      ]
    }).select('restaurantName cuisine description image rating isDineOutAvailable isDeliveryAvailable isPureVeg city address');

    // Search for food items
    const foodItems = await FoodModel.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { cuisineType: searchRegex },
        { category: searchRegex }
      ]
    }).populate('foodPartnerId', 'restaurantName image rating');

    // Combine and format results
    const results = [];
    
    // Add restaurant results
    restaurants.forEach(restaurant => {
      results.push({
        id: restaurant._id,
        type: 'restaurant',
        name: restaurant.restaurantName,
        cuisine: restaurant.cuisine || 'Various',
        description: restaurant.description,
        image: restaurant.image,
        rating: restaurant.rating || 0,
        isDineOutAvailable: restaurant.isDineOutAvailable || false,
        isDeliveryAvailable: restaurant.isDeliveryAvailable || false,
        isPureVeg: restaurant.isPureVeg || false,
        city: restaurant.city,
        address: restaurant.address,
        price: 'Rs 500 for two', // Default price for restaurants
        time: '30 min' // Default time for restaurants
      });
    });

    // Add food item results
    foodItems.forEach(food => {
      if (food.foodPartnerId) {
        results.push({
          id: food._id,
          type: 'food',
          foodPartnerId: food.foodPartnerId._id, // Add restaurant ID for navigation
          name: food.name,
          cuisine: food.cuisineType || food.category,
          description: food.description,
          image: food.image,
          rating: food.foodPartnerId.rating || 0,
          isDineOutAvailable: food.foodPartnerId.isDineOutAvailable || false,
          isDeliveryAvailable: food.foodPartnerId.isDeliveryAvailable || false,
          isPureVeg: food.isVeg || false,
          city: food.foodPartnerId.city,
          address: food.foodPartnerId.address,
          price: `Rs ${food.price}`,
          time: '30 min',
          restaurant: food.foodPartnerId.restaurantName
        });
      }
    });

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex((t) => t.id.toString() === item.id.toString())
    );

    // Sort by rating and name relevance
    uniqueResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      
      if (aNameMatch !== bNameMatch) {
        return bNameMatch - aNameMatch;
      }
      
      return (b.rating || 0) - (a.rating || 0);
    });

    res.status(200).json({
      success: true,
      query: query.trim(),
      results: uniqueResults.slice(0, 20), // Limit to 20 results
      total: uniqueResults.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while searching",
      error: error.message
    });
  }
};

const getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Find all food items for this restaurant
    const menuItems = await FoodModel.find({ foodPartnerId: restaurantId })
      .select('name price description category isVeg image videoUrl')
      .lean();
    
    // Format menu items for frontend
    const formattedMenu = menuItems.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      description: item.description || "Delicious dish prepared with care",
      category: item.category || "Main Course",
      isVeg: item.isVeg,
      image: item.image,
      videoUrl: item.videoUrl
    }));

    res.status(200).json({ 
      menu: formattedMenu,
      count: formattedMenu.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// Get Food Partner Videos
const getFoodPartnerVideos = async (req, res) => {
  try {
    const foodPartner = req.foodPartner;
    
    if (!foodPartner) {
      return res.status(404).json({
        success: false,
        message: 'Food Partner not found'
      });
    }

    // Find all food items for this partner that have videos (isReel: true)
    const foodVideos = await FoodModel.find({ 
      foodPartnerId: foodPartner._id, 
      isReel: true, 
      videoUrl: { $ne: "" } 
    }).sort({ createdAt: -1 });

    // Format the response to match the frontend expected format
    const formattedVideos = foodVideos.map(food => ({
      id: food._id,
      url: food.videoUrl,
      dish: food.name,
      price: `₹${food.price}`,
      restaurant: foodPartner.restaurantName,
      likes: food.likes || 0,
      comments: 0 // Could be added if comments are tracked
    }));

    res.status(200).json({
      success: true,
      videos: formattedVideos,
      count: formattedVideos.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching videos',
      error: error.message
    });
  }
};

// Get all videos (public endpoint, no authentication required)
const getAllVideos = async (req, res) => {
  try {
    // Find all food items that have videos (isReel: true)
    const foodVideos = await FoodModel.find({ 
      isReel: true, 
      videoUrl: { $ne: "" } 
    })
    .populate('foodPartnerId', 'restaurantName image')
    .sort({ createdAt: -1 })
    .limit(50);

    // Format the response to match the frontend expected format
    const formattedVideos = foodVideos.map(food => ({
      id: food._id,
      url: food.videoUrl,
      dish: food.name,
      price: `₹${food.price}`,
      restaurant: food.foodPartnerId?.restaurantName || 'Unknown',
      likes: food.likes || 0,
      comments: 0,
      thumbnailUrl: food.image
    }));

    res.status(200).json({
      success: true,
      videos: formattedVideos,
      count: formattedVideos.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching videos',
      error: error.message
    });
  }
};

// Delete a food item
const deleteFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const foodPartner = req.foodPartner;

    // Find the food item
    const food = await FoodModel.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Check if the food partner owns this food item
    if (food.foodPartnerId.toString() !== foodPartner._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this food item'
      });
    }

    // Delete the food item
    await FoodModel.findByIdAndDelete(foodId);

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting food item',
      error: error.message
    });
  }
};

// Update a food item
const updateFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const foodPartner = req.foodPartner;
    const updateData = req.body;

    // Find the food item
    const food = await FoodModel.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Check if the food partner owns this food item
    if (food.foodPartnerId.toString() !== foodPartner._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this food item'
      });
    }

    // Update the food item
    const updatedFood = await FoodModel.findByIdAndUpdate(
      foodId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      food: updatedFood
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating food item',
      error: error.message
    });
  }
};

module.exports = {
  getFoodPartnerProfile,
  updateFoodPartnerProfile,
  createFood,
  getFoods,
  getFoodById,
  getRestaurants,
  getDashboardStats,
  searchRestaurants,
  getMenuByRestaurant,
  getRestaurantById,
  getFoodPartnerVideos,
  getAllVideos,
  deleteFood,
  updateFood,
};