import React, { useState, useRef, useEffect } from 'react';
import '../../styles/signup.css';

export default function SignupModal({ isOpen, onClose, onSignupSubmit }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [idCardImage, setIdCardImage] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setUsername('');
            setEmail('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setIdCardImage(null);
            setIsDragOver(false);
            setErrors({});
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isOpen]);

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

    const handleImageChange = (file) => {
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, card_image: 'Please select an image file (JPEG, PNG, etc.)' }));
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, card_image: 'Image size should be less than 5MB' }));
                return;
            }
            
            setIdCardImage(file);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.card_image;
                return newErrors;
            });
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleImageChange(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageChange(files[0]);
        }
    };

    const removeImage = () => {
        setIdCardImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.card_image;
            return newErrors;
        });
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setErrors({});
        
        // Validation
        const newErrors = {};
        
        if (!username.trim()) {
            newErrors.username = 'Please enter a username';
        } else if (username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!phone.trim()) {
            newErrors.phone = 'Please enter a phone number';
        } else if (!/^[0-9]{10,15}$/.test(phone.trim())) {
            newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
        }
        
        // 8 characters password policy
        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        
        // Stronger password validation
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
        
        // Submit all fields including image
        if (onSignupSubmit) {
            onSignupSubmit({
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password: password,
                card_image: idCardImage
            });
        }
        
        // Don't reset form or close modal here - let parent handle success/failure
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
                    {/* Username Field */}
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            minLength="3"
                            autoComplete="username"
                            className={errors.username ? 'input-error' : ''}
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>

                    {/* Email Field */}
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

                    {/* Phone Field */}
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0597407177"
                            required
                            pattern="[0-9]{10,15}"
                            title="Please enter a valid phone number (10-15 digits)"
                            autoComplete="tel"
                            className={errors.phone ? 'input-error' : ''}
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
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
                        </div>
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    {/* ID Card Photo Upload Field */}
                    <div className="form-group">
                        <label htmlFor="idCardUpload">ID Card Photo (Optional)</label>
                        <div className="signup-image-upload">
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileInputChange}
                                className="signup-hidden-input" 
                                id="idCardUpload"
                            />
                            
                            {!idCardImage ? (
                                <div
                                    className={`signup-image-dropzone ${isDragOver ? 'signup-drag-over' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={triggerFileInput}
                                >
                                    <svg 
                                        width="48" 
                                        height="48" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                        className="signup-upload-icon"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14,2 14,8 20,8"></polyline>
                                        <circle cx="12" cy="13" r="3"></circle>
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                    </svg>
                                    <div className="signup-upload-text">
                                        {isDragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
                                    </div>
                                    <div className="signup-upload-hint">
                                        PNG, JPG, JPEG up to 5MB
                                    </div>
                                </div>
                            ) : (
                                <div className="signup-image-selected">
                                    <div className="signup-image-header">
                                        <div className="signup-image-status">
                                            <svg 
                                                width="20" 
                                                height="20" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2"
                                                className="signup-check-icon"
                                            >
                                                <path d="M20 6L9 17l-5-5"></path>
                                            </svg>
                                            <span className="signup-image-status-text">Image selected</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={removeImage}
                                            className="signup-remove-btn"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="signup-image-info">
                                        {idCardImage.name} ({(idCardImage.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.card_image && <span className="error-message">{errors.card_image}</span>}
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