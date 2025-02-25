import {
  getFinanceInfoFromFinanceVietstock,
  doSyncFinanceInfoFromFinanceVietstock,
  getFinanceInfoByStock,
} from "../services/fetchDataService.js";
import { sendResponse, sendError } from "../utils/responseHelper.js";

export const getAllFinanceInfoByStock = async (req, res) => {
  try {
    const { stock, periods, type } = req.body;

    if (!stock || !periods || !type) {
      sendResponse(res, 200, "Stock code, periods and type is required!");
      return;
    }

    const data = await getFinanceInfoByStock(stock, periods, type);
    sendResponse(res, 200, "Get Finance information successfully!", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch", error.message);
  }
};

export const getAllFinanceInfoFromFinanceVietstock = async (req, res) => {
  try {
    const { stocks, page = 1, type = "YEAR", fvToken, fvCookie } = req.body;

    if (!stocks || !fvToken || !fvCookie) {
      sendResponse(res, 200, "Stock code, fvToken and fvCookie is required!");
      return;
    }

    const data = await getFinanceInfoFromFinanceVietstock(stocks, page, type, fvToken, fvCookie);
    sendResponse(res, 200, "Get Finance information from Vietstock successfully!", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch", error.message);
  }
};

export const syncFinanceInfoFromFinanceVietstock = async (req, res) => {
  try {
    const { stocks, page = 1, type = "YEAR", fvToken, fvCookie } = req.body;

    if (!stocks || !fvToken || !fvCookie) {
      sendResponse(res, 200, "Stock code, fvToken and fvCookie is required!");
      return;
    }

    const data = await doSyncFinanceInfoFromFinanceVietstock(stocks, page, type, fvToken, fvCookie);
    sendResponse(res, 201, "Sync Finance information from Vietstock successfully!", data);
  } catch (error) {
    sendError(res, 500, "Failed to fetch", error.message);
  }
};
