import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { BASE_URL } from '../config';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    condition: searchParams.get('condition') || '',
    location: searchParams.get('location') || '',
    college: searchParams.get('college') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });
  const [colleges, setColleges] = useState([]);

  const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' }
  ];

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.currentPage]);

  const fetchColleges = async () => {
    try {
      const response = await productsAPI.getColleges();
      setColleges(response.data.colleges);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: 12
      };
      
      if (filters.category === 'All') {
        delete params.category;
      }

      const response = await productsAPI.getAll(params);
      setProducts(response.data.products);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalProducts: response.data.totalProducts
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      condition: '',
      location: '',
      college: '',
      sort: '-createdAt'
    });
    setSearchParams({});
  };

  return (
    <div className="products-page">
      <div className="container">
        {/* Search and Filters */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              🔍 Search
            </button>
          </form>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
              >
                <option value="">All Conditions</option>
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price</label>
              <input
                type="number"
                placeholder="₹0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <input
                type="number"
                placeholder="₹10000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="Enter location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>College</label>
              <select
                value={filters.college}
                onChange={(e) => handleFilterChange('college', e.target.value)}
              >
                <option value="">All Colleges</option>
                {colleges.map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={clearFilters} className="btn btn-outline">
            Clear Filters
          </button>
        </div>

        {/* Results Header */}
        <div className="results-header">
          <h2>{pagination.totalProducts} Products Found</h2>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="products-grid">
              {products.map((product) => (
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
