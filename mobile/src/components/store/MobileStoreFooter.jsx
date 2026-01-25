import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/MobileStore.css';

export default function MobileStoreFooter() {
  return (
    <footer className="mobile-store-footer">
      <div className="mobile-store-footer-content">
        <div className="mobile-store-footer-section">
          <h3>MARS Store</h3>
          <p>Your trusted electronics retailer</p>
        </div>
        
        <div className="mobile-store-footer-section">
          <h4>Quick Links</h4>
          <Link to="/store">Home</Link>
          <Link to="/store/my-orders">My Orders</Link>
          <Link to="/store/my-installments">My Installments</Link>
        </div>
        
        <div className="mobile-store-footer-section">
          <h4>Contact</h4>
          <p>Email: info@marsstore.com</p>
          <p>Phone: +1 234 567 8900</p>
        </div>
      </div>
      
      <div className="mobile-store-footer-bottom">
        <p>&copy; 2024 MARS Store. All rights reserved.</p>
      </div>
    </footer>
  );
}
