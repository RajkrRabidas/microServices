const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../src/models/product.model');
const productRoutes = require('../src/routes/product.routes');

// Mock ImageKit
jest.mock('@imagekit/nodejs', () => {
  return jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockResolvedValue({
      url: 'https://ik.imagekit.io/test/product-123.jpg',
      thumbnailUrl: 'https://ik.imagekit.io/test/tr:w-200/product-123.jpg',
      fileId: 'file_123456',
    }),
  }));
});

let app;
let mongoServer;
let userId;

describe('POST /api/products - Create Product with Images', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', productRoutes);

    // Create a test user ID
    userId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe('Success Cases', () => {
    test('should create a product with images successfully', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '99.99')
        .field('seller', userId.toString())
        .field('currency', 'USD')
        .attach('images', Buffer.from('fake image'), 'test-image.jpg')
        .attach('images', Buffer.from('fake image 2'), 'test-image-2.jpg');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product).toHaveProperty('_id');
      expect(response.body.product.title).toBe('Test Product');
      expect(response.body.product.price.amount).toBe(99.99);
      expect(response.body.product.price.currency).toBe('USD');
      expect(response.body.product.images).toHaveLength(2);
      expect(response.body.product.images[0]).toHaveProperty('URL');
      expect(response.body.product.images[0]).toHaveProperty('id');
    });

    test('should create product with single image', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Single Image Product')
        .field('price', '49.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('image data'), 'image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.product.images).toHaveLength(1);
      expect(response.body.product.images[0].URL).toBe(
        'https://ik.imagekit.io/test/product-123.jpg'
      );
    });

    test('should create product without images', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'No Image Product')
        .field('price', '29.99')
        .field('seller', userId.toString());

      expect(response.status).toBe(201);
      expect(response.body.product.images).toHaveLength(0);
      expect(response.body.product.title).toBe('No Image Product');
    });

    test('should use default currency (INR) when not specified', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Default Currency Product')
        .field('price', '1000')
        .field('seller', userId.toString());

      expect(response.status).toBe(201);
      expect(response.body.product.price.currency).toBe('INR');
    });

    test('should support up to 5 images', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Multi Image Product')
        .field('price', '199.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('img1'), 'img1.jpg')
        .attach('images', Buffer.from('img2'), 'img2.jpg')
        .attach('images', Buffer.from('img3'), 'img3.jpg')
        .attach('images', Buffer.from('img4'), 'img4.jpg')
        .attach('images', Buffer.from('img5'), 'img5.jpg');

      expect(response.status).toBe(201);
      expect(response.body.product.images).toHaveLength(5);
    });
  });

  describe('Validation Errors', () => {
    test('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('price', '99.99')
        .field('seller', userId.toString());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title and price are required');
    });

    test('should return 400 when price is missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Test Product')
        .field('seller', userId.toString());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title and price are required');
    });

    test('should return 401 when seller ID is missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Test Product')
        .field('price', '99.99');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Seller ID is required');
    });

    test('should reject non-image files', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Product with Non-Image')
        .field('price', '99.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('not an image'), 'file.txt');

      // Multer will reject this during parsing
      expect(response.status).toBe(400);
    });

    test('should reject files larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Large File Product')
        .field('price', '99.99')
        .field('seller', userId.toString())
        .attach('images', largeBuffer, 'large-image.jpg');

      expect(response.status).toBe(400);
    });

    test('should allow valid price formats', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Price Test Product')
        .field('price', '99.99')
        .field('seller', userId.toString());

      expect(response.status).toBe(201);
      expect(response.body.product.price.amount).toBe(99.99);
    });
  });

  describe('Database Persistence', () => {
    test('should persist product in database', async () => {
      await request(app)
        .post('/api/products')
        .field('title', 'Database Test Product')
        .field('description', 'Test Description')
        .field('price', '149.99')
        .field('seller', userId.toString());

      const savedProduct = await Product.findOne({ 
        title: 'Database Test Product' 
      });

      expect(savedProduct).not.toBeNull();
      expect(savedProduct.price.amount).toBe(149.99);
      expect(savedProduct.description).toBe('Test Description');
    });

    test('should save images with correct structure', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Image Structure Test')
        .field('price', '79.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('image'), 'test.jpg');

      const productId = response.body.product._id;
      const savedProduct = await Product.findById(productId);

      expect(savedProduct.images[0]).toHaveProperty('URL');
      expect(savedProduct.images[0]).toHaveProperty('thumbnail');
      expect(savedProduct.images[0]).toHaveProperty('id');
    });
  });

  describe('ImageKit Integration', () => {
    test('should call ImageKit upload for each image', async () => {
      const ImageKit = require('imagekit');
      const mockUpload = ImageKit().upload;

      await request(app)
        .post('/api/products')
        .field('title', 'ImageKit Test')
        .field('price', '99.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('img1'), 'img1.jpg')
        .attach('images', Buffer.from('img2'), 'img2.jpg');

      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    test('should include correct ImageKit response data', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'ImageKit Response Test')
        .field('price', '99.99')
        .field('seller', userId.toString())
        .attach('images', Buffer.from('image'), 'test.jpg');

      const image = response.body.product.images[0];
      expect(image.URL).toBe('https://ik.imagekit.io/test/product-123.jpg');
      expect(image.thumbnail).toBe('https://ik.imagekit.io/test/tr:w-200/product-123.jpg');
      expect(image.id).toBe('file_123456');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty description', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'No Description Product')
        .field('price', '49.99')
        .field('seller', userId.toString())
        .field('description', '');

      expect(response.status).toBe(201);
      expect(response.body.product.description).toBe('');
    });

    test('should parse numeric price as string', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'String Price Product')
        .field('price', '125.50')
        .field('seller', userId.toString());

      expect(response.status).toBe(201);
      expect(response.body.product.price.amount).toBe(125.50);
    });

    test('should handle special characters in title', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Product with "quotes" & special <chars>')
        .field('price', '99.99')
        .field('seller', userId.toString());

      expect(response.status).toBe(201);
      expect(response.body.product.title).toContain('quotes');
    });
  });
});
