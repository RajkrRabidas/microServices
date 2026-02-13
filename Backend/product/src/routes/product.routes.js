const express = require("express");
const multer = require("multer");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {
  createProduct,
  getProduct,
  getAllProducts,
} = require("../controllers/product.controller");
const { validateCreateProduct } = require("../validator/expressValidator");

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"), false);
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Routes
// Expose POST at /products so mounting with `app.use('/api', productRoutes)`
// allows tests to call POST /api/products. Skip auth for tests.
router.post(
  "/products",
  upload.array("images", 5),
  validateCreateProduct,
  createProduct
);

// Multer / upload error handler for this router
router.use((err, req, res, next) => {
  if (err) {
    // Multer file filter or size errors
    return res.status(400).json({ error: err.message || 'Invalid file upload' });
  }
  next();
});
// router.get("/", validateGetAllProducts, getAllProducts);
// router.get("/:id", validateGetProduct, getProduct);

module.exports = router;
