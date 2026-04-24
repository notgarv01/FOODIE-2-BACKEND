const mongoose = require("mongoose");

const foodPartnerSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: Number },
    address: { type: String },
    city: { type: String }, // New field for city
    state: { type: String }, // New field for state
    image: { type: String }, // Restaurant Logo/Banner

    // Operational Details
    isNightOpen: { type: Boolean, default: false },
    isDineOutAvailable: { type: Boolean, default: true },
    isDeliveryAvailable: { type: Boolean, default: true },
    isPureVeg: { type: Boolean, default: false },
    cuisine: [{ type: String }], // Array: ['Italian', 'Continental']

    // Location for Map Logic
    location: {
      lat: { type: Number },
      lng: { type: Number },
      city: { type: String },
    },

    // Stats for Dashboard
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalRatingSum: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalIncome: { type: Number, default: 0 },
    menu: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }], // Link to its food items
  },
  { timestamps: true },
);

const FoodPartnerModel = mongoose.model("FoodPartner", foodPartnerSchema);
module.exports = FoodPartnerModel;
