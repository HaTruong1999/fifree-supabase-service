import { getStockFollowing, addListStocks } from "../services/stockService.js";
import { sendResponse, sendError } from "../utils/responseHelper.js";

export const getAllStockFollowing = async (_req, res) => {
  try {
    const data = await getStockFollowing();
    sendResponse(res, 200, "Stock following fetched successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch Stock following", error.message);
  }
};

export const createListStocks = async (req, res) => {
  const { stocks } = req.body;
  try {
    const data = await addListStocks(stocks);
    sendResponse(res, 201, "Funds portfolio added successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to add Funds portfolio", error.message);
  }
};
