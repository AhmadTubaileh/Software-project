import React, { useState } from 'react';
import '../../styles/login.css';

export default function LoginModal({ isOpen, onClose, onLoginSubmit }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setErrors({});
        
        const newErrors = {};
        
        if (!username.trim()) {
            newErrors.username = 'Please enter username or email';
        }
        
        if (!password.trim()) {
            newErrors.password = 'Please enter password';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        if (onLoginSubmit) {
            // Call login handler (async, but errors are handled in parent)
            // Modal closing and navigation are handled in the parent component (Header)
            await onLoginSubmit({
                username: username,
                password: password
            });
            // Reset form fields after login attempt (success or failure handled in parent)
            setUsername('');
            setPassword('');
            setShowPassword(false);
            setErrors({});
        }
    };

    return (
        <div className="login-modal-overlay" onClick={onClose}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Login</h2>
                    <button 
                        className="close-btn" 
                        onClick={onClose}
                        aria-label="Close login modal"
                        style={{ lineHeight: '1' }}
                    >
                        ×
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username or Email</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username or email"
                            required
                            autoComplete="username"
                            className={errors.username ? 'input-error' : ''}
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className={errors.password ? 'input-error' : ''}
                            />
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    {/* Eye button container - same as signup */}
                    <div className="login-eye-button-container">
                        <button
                            type="button"
                            className="login-eye-button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                            {showPassword ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Login button - same style as Create Account */}
                    <button type="submit" className="login-submit-btn">
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
}