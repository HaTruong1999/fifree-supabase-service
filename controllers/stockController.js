import { getStockFollowing } from "../services/stockService.js";
import { sendResponse, sendError } from "../utils/responseHelper.js";

export const getAllStockFollowing = async (_req, res) => {
  try {
    const data = await getStockFollowing();
    sendResponse(res, 200, "Stock following fetched successfully", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch Stock following", error.message);
  }
};
