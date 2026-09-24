import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [searchTerm, roleFilter]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ search: searchTerm, role: roleFilter })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will delete all their products and messages.`)) {
      return;
    }

    setDeleteLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      alert('User deleted successfully');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>🛡️ Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users and monitor platform activity</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#3B82F6' }}>👥</div>
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.users.total}</p>
                <p className="stat-detail">
                  {stats.users.verified} verified • {stats.users.unverified} unverified
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#10B981' }}>📦</div>
              <div className="stat-content">
                <h3>Total Products</h3>
                <p className="stat-number">{stats.products.total}</p>
                <p className="stat-detail">
                  {stats.products.available} available • {stats.products.sold} sold
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#8B5CF6' }}>💬</div>
              <div className="stat-content">
                <h3>Total Messages</h3>
                <p className="stat-number">{stats.messages.total}</p>
                <p className="stat-detail">Platform-wide conversations</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#F59E0B' }}>⚡</div>
              <div className="stat-content">
                <h3>Active Users</h3>
                <p className="stat-number">{stats.users.active}</p>
                <p className="stat-detail">
                  {stats.users.recent} new this week
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="users-section">
          <div className="section-header">
            <h2>User Management</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="🔍 Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="role-filter"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>College</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Messages</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-phone">{user.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">{user.email}</td>
                      <td>{user.college}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                          {user.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="center-cell">{user.stats.productCount}</td>
                      <td className="center-cell">{user.stats.messageCount}</td>
                      <td className="date-cell">{formatDate(user.lastLogin)}</td>
                      <td className="date-cell">{formatDate(user.createdAt)}</td>
                      <td>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="btn-delete"
                            disabled={deleteLoading === user._id}
                          >
                            {deleteLoading === user._id ? '...' : '🗑️'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
