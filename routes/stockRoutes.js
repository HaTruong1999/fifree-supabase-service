import express from "express";
import { getAllStockFollowing, createListStocks } from "../controllers/stockController.js";

const router = express.Router();

router.get("/following", getAllStockFollowing);
router.post("/create-lists", createListStocks);

export default router;
