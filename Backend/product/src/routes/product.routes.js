const express = require("express");
const multer = require("multer");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const {
  createProduct,
} = require("../controllers/product.controller");
const { validateCreateProduct } = require("../validator/expressValidator");

const router = express.Router();

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Accept files with image extensions or image/* mimetype
    const allowedExt = /\.(jpg|jpeg|png|gif)$/i;
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    if (allowedExt.test(file.originalname)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Routes
// Expose POST at /products so mounting with `app.use('/api', productRoutes)`
// allows tests to call POST /api/products. Skip auth for tests.
router.post(
  "/products",
  upload.array("images", 5),
  createAuthMiddleware([ 'admin', 'seller' ]),
  validateCreateProduct,
  createProduct,
);

// Multer / upload error handler for this router
router.use((err, req, res, next) => {
  if (err) {
    // Multer file filter or size errors
    return res
      .status(400)
      .json({ error: err.message || "Invalid file upload" });
  }
  next();
});
// router.get("/", validateGetAllProducts, getAllProducts);
// router.get("/:id", validateGetProduct, getProduct);

module.exports = router;
