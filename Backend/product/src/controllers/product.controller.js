const Product = require('../models/product.model');

/**
 * POST /api/products
 * Create a new product with images
 */
const createProduct = async (req, res) => {
  try {
    const { title, description, price, currency } = req.body;
    const sellerId = req.user?._id || req.body.seller;

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

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const response = await imagekit.upload({
            file: file.buffer,
            fileName: `${Date.now()}-${file.originalname}`,
            folder: '/products',
          });

          images.push({
            URL: response.url,
            thumbnail: response.thumbnailUrl,
            id: response.fileId,
          });
        } catch (imageError) {
          return res.status(500).json({ 
            error: 'Image upload failed',
            details: imageError.message 
          });
        }
      }
    }

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

 getAllProducts = async (req, res) => {
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
