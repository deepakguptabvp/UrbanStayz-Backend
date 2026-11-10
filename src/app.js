import express from "express";
import cors from "cors";
import morgan from "morgan";

// Import Route Handlers
import propertyRoutes from "./routes/PropertyRoute.js";
import authRoutes from "./routes/AuthRoute.js";
import contactRoutes from "./routes/ContactRoute.js";
import bookingRoutes from "./routes/BookingRoute.js";

// Import Error Middlewares
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  app.use(morgan("dev"));
}

// Health Check & Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UrbanStayz API is running 🚀",
    version: "1.0.0",
    docs: {
      properties: "/api/properties",
      auth: "/api/auth",
      contact: "/api/contact",
      bookings: "/api/bookings",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Mount API Routes
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingRoutes);

// Catch 404 routes
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
