/**
 * Standardized API Response Helper
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success", meta = {}) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (Object.keys(meta).length > 0) {
      this.meta = meta;
    }
  }

  static success(res, data, message = "Success", statusCode = 200, meta = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
      data,
    });
  }

  static error(res, message = "Something went wrong", statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}

export default ApiResponse;
