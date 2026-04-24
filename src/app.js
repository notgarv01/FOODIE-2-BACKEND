const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const cors = require("cors");
const authRoutes = require("./routes/auth.Routes");
const foodRoutes = require("./routes/food.Routes");
const userRoutes = require("./routes/user.routes");

// Multer Configuration (temporary memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", authRoutes);
app.use("/api/food", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "videoFile", maxCount: 1 }
]), foodRoutes);
app.use("/api/user", upload.single("profilePhoto"), userRoutes);


module.exports = app;
