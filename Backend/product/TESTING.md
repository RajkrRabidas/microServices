# Product API Jest Testing Setup

## Overview
This document provides guidance for testing the POST /api/products endpoint with image uploads using Jest, Multer, and ImageKit.

## Installation

First, install dependencies:
```bash
npm install
```

## Project Structure

```
product/
├── src/
│   ├── app.js                          # Express app configuration
│   ├── controllers/
│   │   └── product.controller.js       # Product business logic
│   ├── models/
│   │   └── product.model.js            # Mongoose product schema
│   ├── routes/
│   │   └── product.routes.js           # API routes with multer config
│   └── db/
│       └── db.js                       # Database connection
├── tests/
│   ├── setup.js                        # Jest setup file
│   └── product.post.test.js            # Comprehensive test suite
├── jest.config.cjs                     # Jest configuration
├── package.json                        # Dependencies and scripts
└── service.js                          # Main entry point
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers the following scenarios:

### Success Cases
- ✅ Create product with multiple images
- ✅ Create product with single image
- ✅ Create product without images
- ✅ Default currency handling (INR)
- ✅ Support for up to 5 images

### Validation Errors
- ✅ Missing title validation
- ✅ Missing price validation
- ✅ Missing seller ID validation
- ✅ Non-image file rejection
- ✅ File size limit validation (5MB)

### Database Persistence
- ✅ Product persistence in MongoDB
- ✅ Image data structure validation

### ImageKit Integration
- ✅ ImageKit upload calls for each image
- ✅ Correct ImageKit response data handling
- ✅ Image URLs and metadata storage

### Edge Cases
- ✅ Empty description handling
- ✅ Numeric price parsing
- ✅ Special characters in title

## Mocking Strategy

### ImageKit Mock
The ImageKit library is mocked to return consistent test data:
```javascript
{
  url: 'https://ik.imagekit.io/test/product-123.jpg',
  thumbnailUrl: 'https://ik.imagekit.io/test/tr:w-200/product-123.jpg',
  fileId: 'file_123456'
}
```

### Database Mock
MongoDB Memory Server is used for isolated database testing without requiring a real MongoDB instance.

## Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
IMAGEKIT_PUBLIC_KEY=test_public_key
IMAGEKIT_PRIVATE_KEY=test_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/test
```

## API Endpoint Details

### POST /api/products
Create a new product with optional image uploads.

**Request:**
- Method: POST
- Endpoint: /api/products
- Content-Type: multipart/form-data

**Form Fields:**
- `title` (required): Product title
- `price` (required): Product price (number)
- `seller` (required): Seller user ID (MongoDB ObjectId)
- `description` (optional): Product description
- `currency` (optional): Currency code (USD, INR) - defaults to INR
- `images` (optional): Up to 5 image files

**Response:** (201 Created)
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "...",
    "title": "...",
    "description": "...",
    "price": {
      "amount": 99.99,
      "currency": "USD"
    },
    "seller": "...",
    "images": [
      {
        "URL": "https://ik.imagekit.io/...",
        "thumbnail": "https://ik.imagekit.io/...",
        "id": "file_123456"
      }
    ]
  }
}
```

## Multer Configuration

- **Storage**: Memory storage (images stored in RAM during processing)
- **File Limit**: Maximum 5 files
- **File Size Limit**: 5MB per file
- **Accepted Types**: Image files only (image/*)

## Test File Breakdown

### Setup
- MongoMemoryServer for isolated database testing
- Express app initialization with test environment
- Test user ID generation

### Teardown
- Database cleanup after each test
- Proper MongoDB disconnection

### Test Patterns
Each test follows the Arrange-Act-Assert pattern for clarity.

## Running Specific Tests

```bash
# Run a single test file
npm test -- tests/product.post.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should create a product with images"

# Run with verbose output
npm test -- --verbose
```

## Debugging Tests

Enable debug output:
```bash
npm test -- --verbose --detectOpenHandles
```

## CI/CD Integration

For CI/CD pipelines, use:
```bash
npm test -- --ci --coverage --reporters=default --reporters=jest-junit
```

## Common Issues and Solutions

### Issue: MongoMemoryServer not downloading
**Solution**: Ensure proper internet connection or pre-download the MongoDB binaries:
```bash
npm install --save-dev mongodb-memory-server
```

### Issue: Multer file upload errors in tests
**Solution**: Ensure files are attached correctly:
```javascript
.attach('images', Buffer.from('image data'), 'filename.jpg')
```

### Issue: ImageKit mock not being called
**Solution**: Verify jest.mock() is placed before imports in test file (current setup is correct).

## Extending Tests

To add more test cases:

1. Create a new `describe` block for the feature
2. Use `test` or `it` for individual test cases
3. Follow the existing setup/teardown pattern
4. Mock external dependencies as needed

Example:
```javascript
describe('New Feature', () => {
  test('should do something', async () => {
    const response = await request(app)
      .post('/api/products')
      .field('title', 'Test')
      .field('price', '99.99')
      .field('seller', userId.toString());
    
    expect(response.status).toBe(201);
  });
});
```

## Performance Tips

- Tests use MongoMemoryServer which is fast
- Avoid unnecessary database calls in tests
- Mock external services (already done for ImageKit)
- Use `beforeEach` and `afterEach` for cleanup
- Keep test data minimal

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Multer Documentation](https://github.com/expressjs/multer)
- [ImageKit Node SDK](https://github.com/imagekit-developer/imagekit-nodejs)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
