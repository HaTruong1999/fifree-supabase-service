import express from "express";
import {
  getAllFinanceInfoFromFinanceVietstock,
  syncFinanceInfoFromFinanceVietstock,
  getAllFinanceInfoByStock,
  getAllFinanceInfoByCategory,
} from "../controllers/stockFinanceController.js";

const router = express.Router();

router.post("/sync-financeinfo-from-vietstock", syncFinanceInfoFromFinanceVietstock);
router.post("/get-financeinfo-from-vietstock", getAllFinanceInfoFromFinanceVietstock);
router.post("/get-financeinfo-by-stock", getAllFinanceInfoByStock);
router.post("/get-financeinfo-by-category", getAllFinanceInfoByCategory);

export default router;
