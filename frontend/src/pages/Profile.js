import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1>{user.name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>

          <div className="profile-info-grid">
            <div className="info-item">
              <span className="info-label">📱 Phone</span>
              <span className="info-value">{user.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🎓 College</span>
              <span className="info-value">{user.college}</span>
            </div>
            <div className="info-item">
              <span className="info-label">✅ Status</span>
              <span className="info-value verified">Verified</span>
            </div>
            <div className="info-item">
              <span className="info-label">📧 Email</span>
              <span className="info-value">{user.email}</span>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/my-products" className="btn btn-primary">
              📦 My Products
            </Link>
            <Link to="/chat" className="btn btn-outline">
              💬 My Chats
            </Link>
            <Link to="/add-product" className="btn btn-outline">
              ➕ Sell Product
            </Link>
          </div>
        </div>

        <div className="profile-stats">
          <h2>Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <span className="stat-label">Products Listed</span>
                <span className="stat-value">View All</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-info">
                <span className="stat-label">Active Chats</span>
                <span className="stat-value">View Chats</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👁️</div>
              <div className="stat-info">
                <span className="stat-label">Profile Views</span>
                <span className="stat-value">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
