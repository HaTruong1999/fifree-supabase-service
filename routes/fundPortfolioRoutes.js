import express from "express";
import {
  getAllFundsPortfolioStatsByMonth,
  getAllFundsPortfolioGroupByStock,
  createListFundsPortfolio,
  checkExistFundsPortfolio,
  getAllFundsPortfolioByMonth,
  getAllFundsPortfolioByMonthGroupByStock,
} from "../controllers/fundPortfolioController.js";

const router = express.Router();

router.get("/check-exist", checkExistFundsPortfolio);
router.post("/create-lists", createListFundsPortfolio);
router.get("/stats-by-month", getAllFundsPortfolioStatsByMonth);
router.get("/group-by-stock", getAllFundsPortfolioGroupByStock);
router.get("/by-month", getAllFundsPortfolioByMonth);
router.get("/by-month-group-by-stock", getAllFundsPortfolioByMonthGroupByStock);

export default router;
