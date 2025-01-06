import express from "express";
import { getAllFunds, createFund } from "../controllers/fundController.js";

const router = express.Router();

router.get("/funds", getAllFunds);
router.post("/funds", createFund);

export default router;
