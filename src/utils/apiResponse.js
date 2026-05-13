class ApiResponse {
  constructor(statusCode, data = null, message = "Success", errors = []) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (errors.length > 0) {
      this.errors = errors;
    }
  }
}

export default ApiResponse;