const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper function to create conversation ID
const createConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.userId },
        { receiver: req.userId }
      ]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .populate('product', 'title images')
    .sort('-createdAt');

    // Group by conversation and get latest message
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const conversationId = msg.conversationId;
      
      if (!conversationsMap.has(conversationId)) {
        const otherUser = msg.sender._id.toString() === req.userId 
          ? msg.receiver 
          : msg.sender;

        conversationsMap.set(conversationId, {
          conversationId,
          otherUser,
          product: msg.product,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        });
      }

      // Count unread messages
      if (msg.receiver._id.toString() === req.userId && !msg.isRead) {
        conversationsMap.get(conversationId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// @route   GET /api/chat/:otherUserId
// @desc    Get chat messages between current user and another user
// @access  Private
router.get('/:otherUserId', auth, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const conversationId = createConversationId(req.userId, otherUserId);

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('product', 'title images price')
      .sort('createdAt');

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.userId,
        isRead: false
      },
      { isRead: true }
    );

    // Get other user details
    const otherUser = await User.findById(otherUserId).select('name email phone college');

    res.json({ 
      messages,
      otherUser,
      conversationId
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, message, productId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver and message are required' });
    }

    const conversationId = createConversationId(req.userId, receiverId);

    const newMessage = new Message({
      conversationId,
      sender: req.userId,
      receiver: receiverId,
      message,
      product: productId || null
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('product', 'title images price');

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// @route   PUT /api/chat/mark-read/:conversationId
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/mark-read/:conversationId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        receiver: req.userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error while marking messages as read' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      isRead: false
    });

    res.json({ unreadCount: count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

module.exports = router;
