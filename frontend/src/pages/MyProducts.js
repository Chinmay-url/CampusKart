import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { BASE_URL } from '../config';
import './MyProducts.css';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const response = await productsAPI.getMyProducts();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      await productsAPI.delete(id);
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-products-page">
      <div className="container">
        <div className="page-header">
          <h1>My Products 📦</h1>
          <Link to="/add-product" className="btn btn-primary">
            + Add New Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2>No products listed yet</h2>
            <p>Start selling by listing your first product</p>
            <Link to="/add-product" className="btn btn-primary">
              List Your First Product
            </Link>
          </div>
        ) : (
          <div className="products-list">
            {products.map((product) => (
              <div key={product._id} className="product-item">
                <div className="product-item-image">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${BASE_URL}${product.images[0]}`}
                      alt={product.title}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                <div className="product-item-info">
                  <div className="product-item-header">
                    <h3>{product.title}</h3>
                    <span className={`status-badge ${product.status}`}>
                      {product.status}
                    </span>
                  </div>
                  
                  <p className="product-item-description">
                    {product.description.substring(0, 100)}
                    {product.description.length > 100 ? '...' : ''}
                  </p>

                  <div className="product-item-meta">
                    <span className="price">₹{product.price}</span>
                    <span className="category">{product.category}</span>
                    <span className="location">📍 {product.location}</span>
                    <span className="views">👁️ {product.views} views</span>
                  </div>

                  <div className="product-item-date">
                    Listed on {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="product-item-actions">
                  <Link
                    to={`/products/${product._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    View
                  </Link>
                  <Link
                    to={`/edit-product/${product._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn btn-danger btn-sm"
                    disabled={deleteLoading === product._id}
                  >
                    {deleteLoading === product._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProducts;
