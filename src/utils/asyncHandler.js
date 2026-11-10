/**
 * Async Handler Wrapper for Express controllers
 * Automatically catches promises and passes error to next()
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
