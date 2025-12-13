import express from "express";
import mongoose from "mongoose";
import cors from "cors";


let a = await mongoose.connect("mongodb://localhost:27017/");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
