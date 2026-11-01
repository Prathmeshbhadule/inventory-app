const { validationResult } = require('express-validator');

/**
 * Middleware to intercept express-validator results
 * Returns a standardized 400 Bad Request response if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      receivedValue: err.value,
    }));

    return res.status(400).json({
      success: false,
      error: 'Input Validation Failed',
      message: 'Please review and correct the invalid fields submitted.',
      details: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
