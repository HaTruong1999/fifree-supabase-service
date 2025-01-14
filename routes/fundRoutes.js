import express from "express";
import { getAllFunds, getAllFundsPortfolioStats } from "../controllers/fundController.js";

const router = express.Router();

router.get("/", getAllFunds);
router.get("/funds-portfolio-stats", getAllFundsPortfolioStats);

export default router;
