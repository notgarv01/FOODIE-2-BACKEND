const Order = require('../models/Order.model');
const FoodPartner = require('../models/FoodPartner.model');
const mongoose = require('mongoose');

/**
 * Creates a new order with MongoDB transaction
 * Ensures data consistency between Order creation and FoodPartner income update
 */
const createOrderWithTransaction = async (orderData) => {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();
    
    // Create the order document within the session
    const newOrder = new Order({
      ...orderData,
      // Ensure restaurantId is properly set from the restaurant object
      'restaurant.restaurantId': orderData.restaurant.restaurantId
    });
    
    const savedOrder = await newOrder.save({ session });
    
    // Update FoodPartner's totalIncome within the same session
    const updatedPartner = await FoodPartner.findByIdAndUpdate(
      orderData.restaurant.restaurantId,
      { 
        $inc: { totalIncome: orderData.totalAmount }
      },
      { 
        session,
        new: true // Return the updated document
      }
    );
    
    if (!updatedPartner) {
      throw new Error('FoodPartner not found');
    }
    
    // Commit the transaction if both operations succeed
    await session.commitTransaction();
    
    return {
      success: true,
      order: savedOrder,
      partner: updatedPartner,
      message: 'Order created and partner income updated successfully'
    };
    
  } catch (error) {
    // Abort the transaction if any error occurs
    await session.abortTransaction();
    
    console.error('Transaction failed:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Order creation failed. Transaction rolled back.'
    };
    
  } finally {
    // End the session
    await session.endSession();
  }
};

/**
 * Controller function to handle order creation request
 */
const placeOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.user || !orderData.restaurant || !orderData.restaurant.restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user, restaurant, restaurantId'
      });
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }
    
    if (!orderData.totalAmount || orderData.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be greater than 0'
      });
    }
    
    // Generate unique order ID if not provided
    if (!orderData.orderId) {
      orderData.orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    
    // Execute the transaction
    const result = await createOrderWithTransaction(orderData);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        data: {
          order: result.order,
          partnerUpdated: true
        },
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during order placement',
      error: error.message
    });
  }
};

/**
 * Get orders by user ID
 */
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orders = await Order.find({ user: userId })
      .sort({ orderDate: -1 })
      .populate('user', 'name email')
      .populate('restaurant.restaurantId', 'restaurantName email');
    
    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message
    });
  }
};

/**
 * Get orders by restaurant ID (for FoodPartner dashboard)
 */
const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const orders = await Order.find({ 'restaurant.restaurantId': restaurantId })
      .sort({ orderDate: -1 })
      .populate('user', 'name email');
    
    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant orders',
      error: error.message
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!['Confirmed', 'Preparing', 'On the way', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('user', 'name email');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

/**
 * Rate an order and update restaurant rating
 */
const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;
    
    // Validate rating
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5'
      });
    }
    
    // Find the order by orderId (string) or _id (ObjectId)
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order is already rated
    if (order.rating !== null && order.rating !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been rated'
      });
    }
    
    // Update order with rating
    order.rating = rating;
    await order.save();
    
    // Update restaurant rating
    const restaurant = await FoodPartner.findById(order.restaurant.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Calculate new average rating
    const currentRatingCount = restaurant.ratingCount || 0;
    const currentTotalRatingSum = restaurant.totalRatingSum || 0;
    const newRatingCount = currentRatingCount + 1;
    const newTotalRatingSum = currentTotalRatingSum + rating;
    const newAverageRating = newTotalRatingSum / newRatingCount;
    
    // Update restaurant rating fields using $set to ensure fields exist
    const updatedRestaurant = await FoodPartner.findByIdAndUpdate(
      order.restaurant.restaurantId,
      {
        $set: {
          rating: parseFloat(newAverageRating.toFixed(2)),
          ratingCount: newRatingCount,
          totalRatingSum: newTotalRatingSum
        }
      },
      { new: true }
    );
    
    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update restaurant rating'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        order: order,
        restaurant: {
          rating: updatedRestaurant.rating,
          ratingCount: updatedRestaurant.ratingCount,
          totalRatingSum: updatedRestaurant.totalRatingSum
        }
      },
      message: 'Order rated successfully and restaurant rating updated'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to rate order',
      error: error.message
    });
  }
};

module.exports = {
  createOrderWithTransaction,
  placeOrder,
  getUserOrders,
  getRestaurantOrders,
  updateOrderStatus,
  rateOrder
};
