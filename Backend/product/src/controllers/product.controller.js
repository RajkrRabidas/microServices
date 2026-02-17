const Product = require("../models/product.model");
const { uploadImage } = require("../services/imagekit.service");

/**
 * POST /api/products
 * Create a new product with images
 */
const createProduct = async (req, res) => {
  try {
    const { title, description, price, currency = 'INR' } = req.body;

    const seller = req.user && req.user.id;

    if (!seller) {
      return res.status(401).json({ error: "Seller ID is required" });
    }

    const priceAmount = parseFloat(price);
    if (!title || !priceAmount || Number.isNaN(priceAmount)) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    const uploadResults = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer, filename: file.originalname }))
    );

    // Normalize upload results to include both `URL` (schema) and `url` (tests)
    const images = uploadResults.map((u) => ({
      URL: u.url || u.URL,
      url: u.url || u.URL,
      thumbnail: u.thumbnail || u.thumbnailUrl || u.URL,
      id: u.id || u.fileId,
    }));

    const product = new Product({
      title,
      description: description || "",
      price: {
        amount: priceAmount,
        currency,
      },
      seller: seller,
      images,
    });

    await product.save();

    // Convert to plain object and normalize images so tests can access `.url`
    const out = product.toObject({ getters: true });
    out.images = (out.images || []).map((img) => ({ ...img, url: img.url || img.URL }));

    return res.status(201).json({ message: "Product created successfully", data: out });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Failed to create product", details: error.message });
  }
};

module.exports = { createProduct };
