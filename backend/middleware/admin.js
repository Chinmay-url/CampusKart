const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists and is authenticated (from auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

module.exports = adminAuth;
