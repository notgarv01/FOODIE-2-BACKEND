const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    isVeg: { type: Boolean, default: true }, // veg/non-veg logic
    image: { type: String, required: true }, // Static image for menu
    videoUrl: { type: String, default: "" }, // REEL VIDEO LINK (Cloudinary/S3)
    isReel: { type: Boolean, default: false }, // Kya iski reel bani hui hai?
    cuisineType: { type: String }, // Italian, Chinese etc.
    category: {
      type: String,
      enum: ["Starters", "Main Course", "Beverages", "Desserts"],
    },
    likes: { type: Number, default: 0 },
    foodPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodPartner",
      required: true,
    }, // Kis food partner ne create kiya
  },
  { timestamps: true },
);

const FoodModel = mongoose.model("Food", foodSchema);
module.exports = FoodModel;
