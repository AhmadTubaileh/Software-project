import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import './MobilePage.css';

function MobileLogin() {
  const navigate = useNavigate();
  const { currentUser, setSession } = useLocalSession();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/my-tasks', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password) {
      toast.error('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.post('/api/auth/login', {
        username: formData.username.trim(),
        password: formData.password
      });

      // Set session with user data
      setSession(response.user);
      toast.success('Login successful!');
      
      // Redirect to my-tasks page
      navigate('/my-tasks', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
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

  return (
    <div className="mobile-page mobile-login-page">
      <Toaster position="top-center" />
      
      <div className="mobile-login-container">
        <div className="mobile-login-header">
          <div className="mobile-login-icon">🔐</div>
          <h1 className="mobile-login-title">Welcome Back</h1>
          <p className="mobile-login-subtitle">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-login-form">
          <div className="mobile-form-group">
            <label htmlFor="username" className="mobile-form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="mobile-input"
              placeholder="Enter your username"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="mobile-form-group">
            <label htmlFor="password" className="mobile-form-label">
              Password
            </label>
            <div className="mobile-password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="mobile-input mobile-password-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="mobile-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mobile-button mobile-button-primary mobile-login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mobile-login-footer">
          <p className="mobile-login-footer-text">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MobileLogin;
