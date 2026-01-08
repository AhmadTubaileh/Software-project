import React,{useState} from 'react';
import '../../styles/login.css';

export default function LoginModal({isOpen, onClose, onLoginSubmit}){ 

    const[username,setUsername] = useState('');
    const[password,setPassword] = useState('');
    const[showPassword, setShowPassword] = useState(false);


    if(!isOpen){
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault(); //to prevent page reload
        
        // from props
        if (onLoginSubmit) {
            onLoginSubmit({
                username: username,
                password: password
            });
        }
        
        setUsername('');
        setPassword('');
        setShowPassword(false);

        if (onClose) {
            onClose();
        }
    };

    return(
        <div className="login-modal-overlay" onClick={onClose}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Login</h2>
                    <button 
                        className="close-btn" 
                        onClick={onClose}
                        aria-label="Close login modal"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                {/* username/email */}
                <div className="form-group">
                    <label htmlFor="username">Username or Email</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username or email"
                        required
                        
                    />
                </div>


                {/* password */}
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
                        autoComplete="off"
                        />

                        <button
                        type="button"
                        className="show-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                </div>

                {/* Submit Button */}
                <button type="submit">Log In</button>

                <div className="login-form-footer">
                    <a href="/forgot-password" className="forgot-password-link">
                    Forgot password?
                    </a>
                </div>

                </form>
            </div>
        </div>
    );
}
