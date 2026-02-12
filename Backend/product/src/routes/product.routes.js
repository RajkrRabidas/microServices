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
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  validateCreateProduct,
  createProduct,
);
router.get("/", validateGetAllProducts, getAllProducts);
router.get("/:id", validateGetProduct, getProduct);

module.exports = router;
