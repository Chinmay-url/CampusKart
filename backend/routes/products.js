const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   GET /api/products/colleges
// @desc    Get all unique colleges
// @access  Public
router.get('/colleges', async (req, res) => {
  try {
    const User = require('../models/User');
    const colleges = await User.distinct('college');
    res.json({ colleges: colleges.sort() });
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ message: 'Server error while fetching colleges' });
  }
});

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      condition, 
      location, 
      search,
      college,
      status = 'available',
      sort = '-createdAt',
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (condition) {
      query.condition = condition;
    }

    if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    let products, total;
    
    // If college filter is applied, use aggregation to join with User collection
    if (college) {
      const User = require('../models/User');
      
      // First get user IDs that match the college
      const users = await User.find({ college: new RegExp(college, 'i') }).select('_id');
      const userIds = users.map(u => u._id);
      
      // Add seller filter to query
      query.seller = { $in: userIds };
      
      products = await Product.find(query)
        .populate('seller', 'name email phone college')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));
      
      total = await Product.countDocuments(query);
    } else {
      products = await Product.find(query)
        .populate('seller', 'name email phone college')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));
      
      total = await Product.countDocuments(query);
    }

    res.json({
      products,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   GET /api/products/my-products
// @desc    Get current user's products
// @access  Private
router.get('/my-products', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .sort('-createdAt');

    res.json({ products });

  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: 'Server error while fetching your products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email phone college');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, category, condition, location } = req.body;

    // Validation
    if (!title || !description || !price || !category || !condition || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Get uploaded image paths
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      title,
      description,
      price: Number(price),
      category,
      condition,
      location,
      images,
      seller: req.userId
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name email phone college');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { title, description, price, category, condition, location, status } = req.body;

    // Update fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (condition) product.condition = condition;
    if (location) product.location = location;
    if (status) product.status = status;

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate('seller', 'name email phone college');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete product images from filesystem
    product.images.forEach(imagePath => {
      const fullPath = path.join(__dirname, '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   DELETE /api/products/:id/image
// @desc    Delete specific image from product
// @access  Private
router.delete('/:id/image', auth, async (req, res) => {
  try {
    const { imagePath } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    // Remove image from array
    product.images = product.images.filter(img => img !== imagePath);
    await product.save();

    // Delete image file
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ message: 'Image deleted successfully', product });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error while deleting image' });
  }
});

module.exports = router;
