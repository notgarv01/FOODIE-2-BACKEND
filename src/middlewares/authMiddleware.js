const UserModel = require("../models/User.model");
const FoodPartnerModel = require("../models/FoodPartner.model");
const jwt = require("jsonwebtoken");    

const authFoodPartnerMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Please login first" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const foodPartner = await FoodPartnerModel.findById(decoded.id);
    if (!foodPartner) {
      return res.status(401).json({ message: "No food partner found with the provided credentials" });
    }
    req.foodPartner = foodPartner;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

const authUserMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Please login first" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "No user found with the provided credentials" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};


module.exports = {
  authFoodPartnerMiddleware,
  authUserMiddleware

};