import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';
import { paymentAPI } from '../services/api';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const product = location.state?.product;

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [formData, setFormData] = useState({
    // Card details
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    // UPI
    upiId: '',
    // Net Banking
    bankName: '',
    // Delivery details
    deliveryAddress: '',
    phoneNumber: user?.phone || '',
    email: user?.email || ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) {
      navigate('/products');
    }
  }, [product, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    setFormData(prev => ({ ...prev, cardNumber: value }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setFormData(prev => ({ ...prev, expiryDate: value }));
  };

  const handleRazorpayCheckout = async () => {
    try {
      setError('');
      setProcessing(true);

      if (!window.Razorpay) {
        setProcessing(false);
        setError('Payment gateway not loaded. Please refresh the page and try again.');
        return;
      }

      // Create order on backend
      const { data } = await paymentAPI.createOrder({
        amount: product.price,
        productId: product._id,
        productTitle: product.title
      });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'CampusKart',
        description: product.title,
        image: undefined,
        order_id: data.order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          productId: product._id,
          productTitle: product.title
        },
        theme: { color: '#4F46E5' },
        handler: async function (response) {
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              productId: product._id
            });
            setReceiptUrl(verifyRes.data.receiptUrl ? `${BASE_URL}${verifyRes.data.receiptUrl}` : '');
            setPaymentSuccess(true);
          } catch (err) {
            console.error('Verification failed:', err);
            setError('Payment verification failed. If money was deducted, please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp?.error);
        setError(resp?.error?.description || 'Payment failed. Please try again.');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout init error:', err);
      setError(err?.response?.data?.message || 'Unable to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (!product) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your order has been placed successfully.</p>
            <p className="success-message">
              The seller will contact you soon at {formData.phoneNumber}
            </p>
            <div className="order-details">
              <h3>Order Summary</h3>
              <div className="order-item">
                <span>Product:</span>
                <span>{product.title}</span>
              </div>
              <div className="order-item">
                <span>Amount Paid:</span>
                <span className="amount">₹{product.price}</span>
              </div>
              <div className="order-item">
                <span>Payment Method:</span>
                <span className="method">Razorpay</span>
              </div>
            </div>
            {receiptUrl && (
              <a className="btn btn-primary" href={receiptUrl} target="_blank" rel="noreferrer">
                Download Receipt (PDF)
              </a>
            )}
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => navigate('/products')}>Back to Products</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-container">
          {/* Product Summary */}
          <div className="product-summary">
            <h2>Order Summary</h2>
            <div className="summary-product">
              <div className="summary-image">
                {product.images && product.images.length > 0 ? (
                  <img src={`${BASE_URL}${product.images[0]}`} alt={product.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="summary-details">
                <h3>{product.title}</h3>
                <p className="summary-category">{product.category}</p>
                <p className="summary-condition">Condition: {product.condition}</p>
              </div>
            </div>
            
            <div className="price-breakdown">
              <div className="price-row">
                <span>Product Price</span>
                <span>₹{product.price}</span>
              </div>
              <div className="price-row">
                <span>Delivery Charges</span>
                <span className="free">FREE</span>
              </div>
              <div className="price-row total">
                <span>Total Amount</span>
                <span>₹{product.price}</span>
              </div>
            </div>

            <div className="seller-info-summary">
              <h4>Seller Details</h4>
              <p><strong>{product.seller.name}</strong></p>
              <p>{product.seller.college}</p>
              <p>📍 {product.location}</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="payment-form-container">
            <h2>Payment Details</h2>
            <p className="demo-note">🎓 Demo Payment - For College Project</p>
            {error && (
              <div className="error" style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</div>
            )}

            {/* Payment Method Selection */}
            <div className="payment-methods">
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <span className="method-icon">📱</span>
                <span>UPI</span>
              </button>
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="method-icon">💳</span>
                <span>Card</span>
              </button>
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <span className="method-icon">🏦</span>
                <span>Net Banking</span>
              </button>
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <span className="method-icon">💵</span>
                <span>Cash on Delivery</span>
              </button>
            </div>

            <form className="payment-form">
              {/* UPI Payment */}
              {paymentMethod === 'upi' && (
                <div className="payment-section">
                  <h3>UPI Payment</h3>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="yourname@upi"
                      required
                    />
                  </div>
                  <div className="upi-apps">
                    <p>Popular UPI Apps:</p>
                    <div className="upi-icons">
                      <div className="upi-app">Google Pay</div>
                      <div className="upi-app">PhonePe</div>
                      <div className="upi-app">Paytm</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Payment */}
              {paymentMethod === 'card' && (
                <div className="payment-section">
                  <h3>Card Details</h3>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      placeholder="Name on card"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {paymentMethod === 'netbanking' && (
                <div className="payment-section">
                  <h3>Net Banking</h3>
                  <div className="form-group">
                    <label>Select Your Bank</label>
                    <select
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choose Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === 'cod' && (
                <div className="payment-section">
                  <h3>Cash on Delivery</h3>
                  <div className="cod-info">
                    <p>✓ Pay when you receive the product</p>
                    <p>✓ No advance payment required</p>
                    <p>✓ Verify product before payment</p>
                  </div>
                </div>
              )}

              {/* Delivery Details */}
              <div className="payment-section">
                <h3>Delivery Details</h3>
                <div className="form-group">
                  <label>Delivery Address</label>
                  <textarea
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your delivery address"
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="payment-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-large"
                  onClick={() => navigate(-1)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handleRazorpayCheckout}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-small"></span>
                      Processing...
                    </>
                  ) : (
                    <>Pay ₹{product.price} with Razorpay</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
