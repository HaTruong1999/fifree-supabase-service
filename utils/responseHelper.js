export const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    message,
    data,
  });
};

export const sendError = (res, status, message, error = null) => {
  return res.status(status).json({
    message,
    error,
  });
};
