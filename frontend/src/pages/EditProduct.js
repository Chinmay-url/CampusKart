import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { BASE_URL } from '../config';
import './ProductForm.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Electronics',
    condition: 'Good',
    location: '',
    status: 'available'
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  const statuses = ['available', 'sold', 'reserved'];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      const product = response.data.product;
      
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        condition: product.condition,
        location: product.location,
        status: product.status
      });
      setExistingImages(product.images || []);
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + newImages.length + existingImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setNewImages([...newImages, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...newPreviews]);
  };

  const removeExistingImage = async (imagePath) => {
    try {
      await productsAPI.deleteImage(id, imagePath);
      setExistingImages(existingImages.filter(img => img !== imagePath));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const removeNewImage = (index) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
    setNewImages(updatedImages);
    setNewImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.price || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('status', formData.status);

      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      await productsAPI.update(id, formDataToSend);
      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
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
    <div className="product-form-page">
      <div className="container">
        <div className="form-card">
          <h1>Edit Product ✏️</h1>
          <p className="form-subtitle">Update your product details</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Product Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., iPhone 12 Pro Max"
                required
              />
            </div>

            <div className="input-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product in detail..."
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="5000"
                  min="0"
                  required
                />
              </div>

              <div className="input-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Condition *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Campus Hostel Block A"
                required
              />
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="input-group">
                <label>Current Images</label>
                <div className="image-preview-grid">
                  {existingImages.map((img, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={`${BASE_URL}${img}`} alt={`Product ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img)}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Images */}
            {existingImages.length + newImages.length < 5 && (
              <div className="input-group">
                <label>Add More Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageChange}
                />
                <p className="input-hint">
                  {5 - existingImages.length - newImages.length} more image(s) can be added
                </p>
              </div>
            )}

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="input-group">
                <label>New Images</label>
                <div className="image-preview-grid">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate(`/products/${id}`)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
