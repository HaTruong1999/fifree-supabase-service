import {
  getFundsPortfolioStatsByMonth,
  getFundsPortfolioGroupByStock,
  addListFundsPortfolio,
  getFundsPortfolioByMonth,
  getFundsPortfolioByMonthGroupByStock,
} from "../services/fundPortfolioService.js";
import { sendResponse, sendError } from "../utils/responseHelper.js";

export const getAllFundsPortfolioStatsByMonth = async (req, res) => {
  try {
    const { category, start_date, end_date, search_stock } = req.query;
    const data = await getFundsPortfolioStatsByMonth(category, start_date, end_date, search_stock);
    sendResponse(res, 200, "Funds Portfolio stats by month fetched successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch Funds Portfolio By Month", error.message);
  }
};

export const getAllFundsPortfolioGroupByStock = async (req, res) => {
  try {
    const { category, start_date, end_date, search_stock } = req.query;
    const data = await getFundsPortfolioGroupByStock(category, start_date, end_date, search_stock);
    sendResponse(res, 200, "Funds Portfolio group by stock fetched successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch Funds Portfolio By Month", error.message);
  }
};

export const getAllFundsPortfolioByMonth = async (req, res) => {
  const { period, fund_code, search_stock } = req.query;
  try {
    const data = await getFundsPortfolioByMonth(period, fund_code, search_stock);
    sendResponse(res, 200, "Funds portfolio by month successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to get by month Funds portfolio", error.message);
  }
};

export const getAllFundsPortfolioByMonthGroupByStock = async (req, res) => {
  const { period, search_stock } = req.query;
  try {
    const data = await getFundsPortfolioByMonthGroupByStock(period, search_stock);
    sendResponse(res, 200, "Funds portfolio by month group by stock successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to get by month Funds portfolio", error.message);
  }
};

export const checkExistFundsPortfolio = async (req, res) => {
  const { period, fund_code } = req.query;
  try {
    const data = await getFundsPortfolioByMonth(period, fund_code);
    sendResponse(res, 200, "Funds portfolio check exist successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to check exist Funds portfolio", error.message);
  }
};

export const createListFundsPortfolio = async (req, res) => {
  const { funds_portfolio } = req.body;
  try {
    const data = await addListFundsPortfolio(funds_portfolio);
    sendResponse(res, 201, "Funds portfolio added successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to add Funds portfolio", error.message);
  }
};
