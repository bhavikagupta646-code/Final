const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "Backend is working successfully!"
  });
});

// Get users API (demo)
app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Raam" },
    { id: 2, name: "Rahul" }
  ]);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});