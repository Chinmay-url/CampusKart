import React from 'react';
import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="brand">CampusKart</div>
          <div className="links">
            <a href="/products">Products</a>
            <a href="/chat">Chat</a>
            <a href="/profile">Profile</a>
          </div>
          <div className="copy">© {year} CampusKart</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
