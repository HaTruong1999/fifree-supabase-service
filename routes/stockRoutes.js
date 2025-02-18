import express from "express";
import { getAllStockFollowing } from "../controllers/stockController.js";

const router = express.Router();

router.get("/", getAllStockFollowing);

export default router;
