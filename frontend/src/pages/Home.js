import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { BASE_URL } from '../config';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 6, sort: '-createdAt' });
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Electronics', icon: '💻', color: '#3B82F6' },
    { name: 'Books', icon: '📚', color: '#10B981' },
    { name: 'Furniture', icon: '🪑', color: '#F59E0B' },
    { name: 'Clothing', icon: '👕', color: '#EC4899' },
    { name: 'Sports', icon: '⚽', color: '#8B5CF6' },
    { name: 'Other', icon: '🎯', color: '#6B7280' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">CampusKart</span>
            </h1>
            <p className="hero-subtitle">
              Your campus marketplace for buying and selling products with fellow students
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary btn-large">
                Browse Products
              </Link>
              <Link to="/add-product" className="btn btn-outline btn-large">
                Sell Something
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Browse by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name}`}
                className="category-card"
                style={{ borderColor: category.color }}
              >
                <span className="category-icon" style={{ backgroundColor: category.color }}>
                  {category.icon}
                </span>
                <span className="category-name">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Recently Listed</h2>
            <Link to="/products" className="view-all-link">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="product-card"
                >
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={`${BASE_URL}${product.images[0]}`}
                        alt={product.title}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <span className="product-condition">{product.condition}</span>
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-location">📍 {product.location}</p>
                    <div className="product-footer">
                      <span className="product-price">₹{product.price}</span>
                      <span className="product-category">{product.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && featuredProducts.length === 0 && (
            <div className="empty-state">
              <p>No products available yet. Be the first to list something!</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose CampusKart?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Safe</h3>
              <p>Email verification ensures only verified students can trade</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Real-time Chat</h3>
              <p>Connect instantly with buyers and sellers through our chat system</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Easy Payments</h3>
              <p>Integrated payment gateway for secure transactions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Campus Community</h3>
              <p>Buy and sell within your trusted college community</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
