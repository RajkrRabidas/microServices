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
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
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
const validateGetAllProducts = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

// Validation rules for getting a single product
const validateGetProduct = [
  query("id")
    .optional()
    .isMongoId()
    .withMessage("Invalid product ID"),
  handleValidationErrors,
];

module.exports = {
  validateCreateProduct,
  validateGetAllProducts,
  validateGetProduct,
};
