const { body, query, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors
        .array()
        .map((err) => ({ field: err.param, message: err.msg })),
    });
  }
  next();
};

// Validation rules for creating a product
const validateCreateProduct = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),

  body("currency")
    .optional()
    .trim()
    .isIn(["INR", "USD", "EUR", "GBP", "JPY", "AUD"])
    .withMessage("Currency must be one of: INR, USD, EUR, GBP, JPY, AUD"),
  handleValidationErrors,
];

// Validation rules for getting all products (pagination)

// Validation rules for getting a single product

module.exports = {
  validateCreateProduct,
};
