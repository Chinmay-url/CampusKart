const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, productId, productTitle } = req.body;

    if (!amount || !productId) {
      return res.status(400).json({ message: 'Amount and product ID are required' });
    }

  // Update the create-order endpoint in backend/routes/payment.js
const options = {
  amount: amount * 100,
  currency: 'INR',
  receipt: `rcpt_${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 40),
  notes: {
    productId,
    productTitle: productTitle || 'Product',
    userId: req.userId
  }
};

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Server error while creating payment order',
      error: error.message 
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      productId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    // Create signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    // Verify signature
    if (razorpay_signature === expectedSignature) {

      const order = await razorpay.orders.fetch(razorpay_order_id);
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      const receiptsDir = path.join(__dirname, '..', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const fileName = `receipt_${order.receipt || razorpay_order_id}_${razorpay_payment_id}.pdf`;
      const filePath = path.join(receiptsDir, fileName);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc
        .fontSize(22)
        .text('CampusKart', { align: 'left' })
        .moveDown(0.2)
        .fontSize(16)
        .text('Payment Receipt', { align: 'left' })
        .moveDown(1);

      doc
        .fontSize(12)
        .text(`Date: ${new Date().toLocaleString()}`)
        .text(`Order ID: ${razorpay_order_id}`)
        .text(`Payment ID: ${razorpay_payment_id}`)
        .text(`Receipt: ${order.receipt}`)
        .moveDown(0.5)
        .text(`Amount: ₹${(order.amount / 100).toFixed(2)} ${order.currency}`)
        .text(`Status: ${payment.status}`)
        .text(`Method: ${payment.method || 'N/A'}`)
        .moveDown(0.5)
        .text(`Product: ${order.notes?.productTitle || 'Product'}`)
        .text(`Product ID: ${order.notes?.productId || ''}`)
        .moveDown(0.5)
        .text(`Buyer Email: ${payment.email || ''}`)
        .text(`Buyer Contact: ${payment.contact || ''}`)
        .moveDown(1)
        .text('Thank you for your purchase!', { align: 'left' });

      doc.end();

      writeStream.on('finish', () => {
        const receiptUrl = `/receipts/${fileName}`;
        res.json({
          success: true,
          message: 'Payment verified successfully',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: order.amount / 100,
          currency: order.currency,
          receiptUrl
        });
      });
      writeStream.on('error', (err) => {
        console.error('Receipt generation error:', err);
        res.json({
          success: true,
          message: 'Payment verified successfully (receipt generation failed)',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        });
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      message: 'Server error while verifying payment',
      error: error.message 
    });
  }
});

// @route   GET /api/payment/:paymentId
// @desc    Get payment details
// @access  Private
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at
      }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching payment details',
      error: error.message 
    });
  }
});

module.exports = router;
