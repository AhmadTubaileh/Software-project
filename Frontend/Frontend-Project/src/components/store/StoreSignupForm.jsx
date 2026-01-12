import React, { useState } from 'react';
import '../../styles/signup.css';

export default function SignupModal({ isOpen, onClose, onSignupSubmit }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) {
        return null;
    }

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Validate password strength (optional)
    const validatePasswordStrength = (password) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setErrors({});
        
        // Validation
        const newErrors = {};
        
        if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        //  8 characters password policy
        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        
        //   stronger password validation
         if (!validatePasswordStrength(password)) {
             newErrors.password = 'Password must contain uppercase, lowercase, and a number';
         }
        
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        // If there are errors, don't submit
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        //  submit email and password
        if (onSignupSubmit) {
            onSignupSubmit({
                email: email,
                password: password
               
            });
        }
        
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setErrors({});

        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="signup-modal-overlay" onClick={onClose}>
            <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Sign Up</h2>
                    <button 
                        className="close-btn" 
                        onClick={onClose}
                        aria-label="Close signup modal"
                        style={{ lineHeight: '1' }}  
                    >
                        ×
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="signup-form">
                    {/* Email Field Only */}
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password (min. 8 characters)"
                                required
                                autoComplete="new-password"
                                className={errors.password ? 'input-error' : ''}
                            />
                            {/* REMOVE the show-password-btn from here */}
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                required
                                autoComplete="new-password"
                                className={errors.confirmPassword ? 'input-error' : ''}
                            />
                            {/* REMOVE the show-password-btn from here too */}
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* ADD the eye button outside both inputs, after the confirm password field */}
                    <div className="signup-eye-button-container">
                        <button
                            type="button"
                            className="signup-eye-button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                            title={showPassword ? 'Hide passwords' : 'Show passwords'}
                        >
                            {showPassword ? (
                                // Eye with slash icon (hide)
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                // Eye icon (show)
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                           
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="signup-submit-btn">
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
}