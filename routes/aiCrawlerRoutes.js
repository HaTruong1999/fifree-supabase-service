import express from 'express';
import { handleAiCrawl } from '../controllers/aiCrawlerController.js';

const router = express.Router();

router.post('/fund-portfolio', handleAiCrawl);

export default router;
