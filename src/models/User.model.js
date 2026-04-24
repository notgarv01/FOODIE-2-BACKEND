const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String }, // New field for city
  state: { type: String }, // New field for state
  profilePhoto: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }], // Jo reels like kari hain
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }], // Restaurants follow kiye hain
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }], // Favorite restaurants
  cart: [
    {
      foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number, default: 1 },
      image: { type: String },
      restaurant: { type: String },
      restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodPartner" },
      isVeg: { type: Boolean, default: false },
      category: { type: String },
    },
  ],
  orders: { type: Number, default: 0 }, // Total orders count
}, { timestamps: true });

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
