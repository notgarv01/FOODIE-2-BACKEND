const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  restaurant: {
    restaurantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'FoodPartner', 
      required: true 
    },
    name: { type: String, required: true },
    address: { type: String, required: true }
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      default: ''
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Preparing', 'On the way', 'Delivered', 'Cancelled'],
    default: 'Confirmed'
  },
  estimatedTime: {
    type: String,
    default: '30-35 mins'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'UPI', 'CARD'],
    default: 'COD'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  }
}, {
  timestamps: true
});

// Create index for faster queries
OrderSchema.index({ user: 1, orderDate: -1 });
OrderSchema.index({ orderId: 1 });

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
