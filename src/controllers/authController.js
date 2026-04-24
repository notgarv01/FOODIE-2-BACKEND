const UserModel = require("../models/User.model");
const FoodPartnerModel = require("../models/FoodPartner.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || undefined,
      address: address || undefined,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    // Save user to database
    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("token", { httpOnly: true, path: '/' });
  res.status(200).json({ message: "Logout successful" });
};

const registerPartner = async (req, res) => {
  const { restaurantName, ownerName, email, password } = req.body;

  const isAlreadyRegistered = await FoodPartnerModel.findOne({ email });
  if (isAlreadyRegistered) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const isRestaurantNameTaken = await FoodPartnerModel.findOne({ restaurantName });
  if (isRestaurantNameTaken) {
    return res.status(400).json({ message: "Restaurant name already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newPartner = await FoodPartnerModel.create({
    restaurantName,
    ownerName,
    email,
    password: hashedPassword,
  });
    

  const token = jwt.sign({ id: newPartner._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
  });

  await newPartner.save();

  res.status(201).json({ message: "Food partner registered successfully", partner: newPartner });

};

const loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find food partner by email
    const partner = await FoodPartnerModel.findOne({ email });
    if (!partner) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({ message: "Login successful", partner });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const logoutPartner = (req, res) => {
  res.clearCookie("token", { httpOnly: true, path: '/', sameSite: 'lax', secure: false });
  res.status(200).json({ message: "Logout successful" });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  registerPartner,
  loginPartner,
  logoutPartner,
};
