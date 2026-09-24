const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

// @route   GET /api/admin/users
// @desc    Get all users with stats
// @access  Private (Admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { search, role, sortBy = '-lastLogin' } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { college: new RegExp(search, 'i') }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -otp -otpExpiry')
      .sort(sortBy);

    // Get product counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const productCount = await Product.countDocuments({ seller: user._id });
        const messageCount = await Message.countDocuments({
          $or: [{ sender: user._id }, { receiver: user._id }]
        });

        return {
          ...user.toObject(),
          stats: {
            productCount,
            messageCount
          }
        };
      })
    );

    res.json({
      users: usersWithStats,
      total: usersWithStats.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: 'available' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });
    const totalMessages = await Message.countDocuments();

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Active users (logged in last 7 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        recent: recentUsers,
        active: activeUsers
      },
      products: {
        total: totalProducts,
        available: availableProducts,
        sold: soldProducts,
        reserved: totalProducts - availableProducts - soldProducts
      },
      messages: {
        total: totalMessages
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their data
// @access  Private (Admin only)
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete user's products
    const userProducts = await Product.find({ seller: userId });
    await Product.deleteMany({ seller: userId });

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User and all associated data deleted successfully',
      deletedData: {
        products: userProducts.length,
        user: user.name
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error while updating role' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private (Admin only)
router.get('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find({ seller: user._id });
    const messageCount = await Message.countDocuments({
      $or: [{ sender: user._id }, { receiver: user._id }]
    });

    res.json({
      user: {
        ...user.toObject(),
        stats: {
          productCount: products.length,
          messageCount
        }
      },
      products
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

module.exports = router;
