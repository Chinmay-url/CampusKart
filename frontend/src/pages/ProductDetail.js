import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Navigate to payment page with product details
    navigate('/payment', { state: { product } });
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${product.seller._id}`, { state: { product } });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    );
  }

  const isOwner = user && product.seller._id === user.id;

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-grid">
          {/* Image Gallery */}
          <div className="image-gallery">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <img
                  src={`${BASE_URL}${product.images[selectedImage]}`}
                  alt={product.title}
                />
              ) : (
                <div className="no-image-large">No Image Available</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-grid">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={`${BASE_URL}${img}`} alt={`${product.title} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-detail-info">
            <div className="product-header">
              <h1>{product.title}</h1>
              <span className={`status-badge ${product.status}`}>
                {product.status}
              </span>
            </div>

            <div className="product-price-section">
              <span className="price">₹{product.price}</span>
              <span className="condition-badge">{product.condition}</span>
            </div>

            <div className="product-meta">
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{product.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Location:</span>
                <span className="meta-value">📍 {product.location}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Views:</span>
                <span className="meta-value">👁️ {product.views}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Posted:</span>
                <span className="meta-value">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Seller Info */}
            <div className="seller-info">
              <h3>Seller Information</h3>
              <div className="seller-details">
                <div className="seller-avatar">👤</div>
                <div>
                  <p className="seller-name">{product.seller.name}</p>
                  <p className="seller-college">{product.seller.college}</p>
                  <p className="seller-contact">📧 {product.seller.email}</p>
                  <p className="seller-contact">📱 {product.seller.phone}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {isOwner ? (
                <>
                  <Link to={`/edit-product/${product._id}`} className="btn btn-primary btn-large">
                    Edit Product
                  </Link>
                  <Link to="/my-products" className="btn btn-outline btn-large">
                    View My Products
                  </Link>
                </>
              ) : product.status === 'available' ? (
                <>
                  <button
                    onClick={handleBuyNow}
                    className="btn btn-primary btn-large"
                  >
                    💳 Buy Now
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="btn btn-outline btn-large"
                  >
                    💬 Contact Seller
                  </button>
                </>
              ) : (
                <div className="sold-message">
                  This product is no longer available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
