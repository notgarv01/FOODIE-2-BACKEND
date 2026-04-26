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
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      return callback(null, origin);
    }
    
    // For debugging, log rejected origins
    console.log('CORS rejected origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

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
