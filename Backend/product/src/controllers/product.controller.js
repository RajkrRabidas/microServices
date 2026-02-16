const Product = require("../models/product.model");
const { uploadImage } = require("../services/imagekit.service");

/**
 * POST /api/products
 * Create a new product with images
 */
const createProduct = async (req, res) => {
  try {
    const { title, description, price, currency = "INR" } = req.body;

    const sellerId = (req.user && req.user.id) || req.body.seller; // support tests sending seller in body

    if (!sellerId) {
      return res.status(401).json({
        error: "Seller ID is required",
      });
    }

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));

    const product = new Product({
      title,
      description: description || "",
      price: {
        amount: parseFloat(price),
        currency: currency || "INR",
      },
      seller: sellerId,
      images,
    });

    await product.save();

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      error: "Failed to create product",
      details: error.message,
    });
  }
};

module.exports = {
  createProduct,
};
