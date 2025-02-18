import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fundRoutes from "../routes/fundRoutes.js";
import fundPortfolioRoutes from "../routes/fundPortfolioRoutes.js";
import stockRoutes from "../routes/stockRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request body

// Routes
app.use("/api/funds", fundRoutes);
app.use("/api/funds-portfolio", fundPortfolioRoutes);
app.use("/api/stock-following", stockRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
