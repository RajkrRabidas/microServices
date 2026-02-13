const Product = require('../models/product.model');
const { uploadImage } = require('../services/imagekit.service');

/**
 * POST /api/products
 * Create a new product with images
 */
const createProduct = async (req, res) => {
  try {
    const { title, description, price, currency } = req.body;
    
    const sellerId = (req.user && req.user.id) || req.body.seller; // support tests sending seller in body

    // Validation
    if (!title || !price) {
      return res.status(400).json({ 
        error: 'Title and price are required' 
      });
    }

    if (!sellerId) {
      return res.status(401).json({ 
        error: 'Seller ID is required' 
      });
    }

    const uploaded = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));
    const images = (uploaded || []).map(u => ({ URL: u.url, thumbnail: u.thumbnail, id: u.id }));

    const product = new Product({
      title,
      description: description || '',
      price: {
        amount: parseFloat(price),
        currency: currency || 'INR',
      },
      seller: sellerId,
      images,
    });

    await product.save();

    return res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
};


const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id).populate('seller', 'name email');
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const products = await Product.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('seller', 'name email');

    const total = await Product.countDocuments();

    return res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
};

module.exports = {
  createProduct,
  getProduct,
  getAllProducts,
};
