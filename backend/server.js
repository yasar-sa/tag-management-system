import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import tagRoutes from "./routes/tagRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js"

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/tag-management-system")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("API working");
});

// Routes
app.use("/api", tagRoutes);
app.use("/api", groupRoutes);
app.use("/api", familyRoutes);
app.use("/api", courseRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", itemRoutes);
app.use("/api", analyticsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Server error",
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
