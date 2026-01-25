import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import '../../styles/MobileStore.css';

export default function MobileSignupModal({ isOpen, onClose, onSignupSubmit }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    card_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, card_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    onSignupSubmit(formData);
  };

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div className="mobile-modal-content mobile-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-modal-header">
          <h2>Sign Up</h2>
          <button className="mobile-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mobile-modal-form">
          <div className="mobile-form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div className="mobile-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mobile-form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div className="mobile-form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="mobile-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="mobile-form-group">
            <label htmlFor="card_image">ID Card Image (Optional)</label>
            <div className="mobile-file-upload">
              <input
                id="card_image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="card_image" className="mobile-file-upload-label">
                <Upload size={20} />
                {imagePreview ? 'Change Image' : 'Upload ID Card'}
              </label>
              {imagePreview && (
                <div className="mobile-image-preview">
                  <img src={imagePreview} alt="ID Card Preview" />
                </div>
              )}
            </div>
          </div>
          
          <button type="submit" className="mobile-btn-primary">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
