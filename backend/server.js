const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CampusKart API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io for real-time chat
const Message = require('./models/Message');

// Store active users
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // User joins
  socket.on('user_connected', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} connected with socket ${socket.id}`);
    
    // Notify user's status to others
    socket.broadcast.emit('user_online', userId);
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`💬 Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, receiverId, message, productId } = data;

      // Save message to database
      const newMessage = new Message({
        conversationId,
        sender: senderId,
        receiver: receiverId,
        message,
        product: productId || null
      });

      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .populate('product', 'title images price');

      // Emit to conversation room
      io.to(conversationId).emit('receive_message', populatedMessage);

      // Emit to receiver if they're online but not in the conversation room
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          conversationId,
          sender: populatedMessage.sender,
          message: populatedMessage.message
        });
      }

      console.log(`📨 Message sent in conversation ${conversationId}`);

    } catch (error) {
      console.error('Socket send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    try {
      const { conversationId, userId } = data;

      await Message.updateMany(
        {
          conversationId,
          receiver: userId,
          isRead: false
        },
        { isRead: true }
      );

      socket.to(conversationId).emit('messages_read', { conversationId, userId });

    } catch (error) {
      console.error('Socket mark read error:', error);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    // Remove user from active users
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        socket.broadcast.emit('user_offline', userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 Network access enabled - Share your local IP to access from other devices`);
  
  // Get local IP address
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\n📱 Access from other devices using:');
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   http://${iface.address}:${PORT}`);
      }
    });
  });
  console.log('');
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
});

module.exports = { app, server, io };
