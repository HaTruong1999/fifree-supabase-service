import { getFunds, getFundsPortfolioStats } from "../services/fundService.js";
import { sendResponse, sendError } from "../utils/responseHelper.js";

export const getAllFunds = async (req, res) => {
  try {
    const data = await getFunds();
    sendResponse(res, 200, "Funds fetched successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch Funds", error.message);
  }
};

export const getAllFundsPortfolioStats = async (req, res) => {
  try {
    const data = await getFundsPortfolioStats();

    sendResponse(res, 200, "Funds Portfolio Stats:", data);
  } catch (error) {
    sendError(res, 500, "Unexpected error:", error.message);
  }
};

export const createFund = async (req, res) => {
  const { user_id, amount, type } = req.body;
  try {
    const data = await addFund(user_id, amount, type);
    sendResponse(res, 201, "Fund added successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to add Fund", error.message);
  }
};
