import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useLocalSession } from '../../hooks/useLocalSession';
import MobileLoginModal from './MobileLoginModal';
import MobileSignupModal from './MobileSignupModal';
import toast from 'react-hot-toast';
import '../../styles/MobileStore.css';

export default function MobileStoreHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { currentUser, setSession } = useLocalSession();
  const isLoggedIn = !!currentUser;
  const navigate = useNavigate();

  const handleLoginSubmit = useCallback(async (credentials) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: credentials.username, password: credentials.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSession(data.user);
      toast.success('Login successful!');
      setIsLoginModalOpen(false);
      setIsMenuOpen(false);

      if (data.user.role === 'admin' || data.user.role === 'employee') {
        navigate('/my-tasks');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    }
  }, [setSession, navigate]);

  const handleLogout = useCallback(() => {
    setSession(null);
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setIsMenuOpen(false);
    toast.success('Logged out successfully!');
    navigate('/');
  }, [setSession, navigate]);

  const handleSignupSubmit = useCallback(async (userData) => {
    try {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('password', userData.password);
      formData.append('user_type', '10');
      
      if (userData.card_image) {
        formData.append('card_image', userData.card_image);
      }

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSession(data.user);
      toast.success(data.message || 'Account created successfully!');
      setIsSignupModalOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    }
  }, [setSession]);

  return (
    <>
      <header className="mobile-store-header">
        <Link to="/store" className="mobile-store-logo">
          MARS
        </Link>

        <div className="mobile-store-header-actions">
          {isLoggedIn && (
            <Link to="/store/cart" className="mobile-store-header-icon">
              <ShoppingCart size={24} />
            </Link>
          )}
          
          <button 
            className="mobile-store-header-icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="mobile-store-menu">
          <div className="mobile-store-menu-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-store-menu-content">
            {isLoggedIn ? (
              <>
                <div className="mobile-store-menu-user">
                  <User size={24} />
                  <span>{currentUser.username}</span>
                </div>
                <Link to="/store/cart" className="mobile-store-menu-item" onClick={() => setIsMenuOpen(false)}>
                  <ShoppingCart size={20} />
                  Cart
                </Link>
                <Link to="/store/my-orders" className="mobile-store-menu-item" onClick={() => setIsMenuOpen(false)}>
                  My Orders
                </Link>
                <Link to="/store/my-installments" className="mobile-store-menu-item" onClick={() => setIsMenuOpen(false)}>
                  My Installments
                </Link>
                <button className="mobile-store-menu-item" onClick={handleLogout}>
                  <LogOut size={20} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="mobile-store-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                >
                  Login
                </button>
                <button 
                  className="mobile-store-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSignupModalOpen(true);
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <MobileLoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSubmit={handleLoginSubmit}
      />
      <MobileSignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSubmit={handleSignupSubmit}
      />
    </>
  );
}
