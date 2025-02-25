import express from "express";
import {
  getAllFinanceInfoFromFinanceVietstock,
  syncFinanceInfoFromFinanceVietstock,
  getAllFinanceInfoByStock,
} from "../controllers/fetchDataController.js";

const router = express.Router();

router.post("/sync-financeinfo-from-vietstock", syncFinanceInfoFromFinanceVietstock);
router.post("/get-financeinfo-from-vietstock", getAllFinanceInfoFromFinanceVietstock);
router.post("/get-financeinfo-by-stock", getAllFinanceInfoByStock);

export default router;
