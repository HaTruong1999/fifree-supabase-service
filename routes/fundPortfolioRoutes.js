import express from "express";
import {
  getAllFundsPortfolioByMonth,
  getAllFundsPortfolioGroupByStock,
  createListFundsPortfolio,
  checkExistFundsPortfolio,
} from "../controllers/fundPortfolioController.js";

const router = express.Router();

router.get("/check-exist", checkExistFundsPortfolio);
router.post("/create-lists", createListFundsPortfolio);
router.get("/stats-by-month", getAllFundsPortfolioByMonth);
router.get("/group-by-stock", getAllFundsPortfolioGroupByStock);

export default router;
