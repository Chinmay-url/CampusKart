import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMobileMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          🛒 CampusKart
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? '✕' : '☰'}
        </button>

        <div className={`navbar-menu ${showMobileMenu ? 'active' : ''}`}>
          <Link 
            to="/products" 
            className="navbar-link"
            onClick={() => setShowMobileMenu(false)}
          >
            Browse Products
          </Link>

          {isAuthenticated ? (
            <>
              <Link 
                to="/add-product" 
                className="navbar-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Sell Product
              </Link>
              <Link 
                to="/my-products" 
                className="navbar-link"
                onClick={() => setShowMobileMenu(false)}
              >
                My Products
              </Link>
              <Link 
                to="/chat" 
                className="navbar-link chat-link"
                onClick={() => setShowMobileMenu(false)}
              >
                💬 Chat
                {unreadCount > 0 && (
                  <span className="badge">{unreadCount}</span>
                )}
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="navbar-link admin-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🛡️ Admin
                </Link>
              )}
              <div className="navbar-user">
                <span className="user-name">👤 {user?.name}</span>
                <div className="user-dropdown">
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item">
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="navbar-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="btn btn-primary"
                onClick={() => setShowMobileMenu(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
