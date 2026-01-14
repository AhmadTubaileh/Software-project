import React,{useState, useCallback} from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from './StoreLoginForm';
import SignupModal from './StoreSignupForm';
import { useLocalSession } from '../../hooks/useLocalSession';
import toast from 'react-hot-toast';

export default function Header() {
  const [searchText, setSearchText] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { currentUser, setSession } = useLocalSession();
  const isLoggedIn = !!currentUser;
  const navigate = useNavigate();

  function saveSearch(event) {
    setSearchText(event.target.value);
  }

  function clickedKey(event) {
    if (event.key === "Enter") {
      console.log(searchText);
    }
  }

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

      // Set session with user data from backend
      setSession(data.user);
      toast.success('Login successful!');
      setIsLoginModalOpen(false);

      // Redirect based on role (same as backend home would do)
      // Admin (role 0) and Employee (role 1-9) go to backend home (/)
      // Customer stays on store pages
      if (data.user.role === 'admin' || data.user.role === 'employee') {
        navigate('/home');
      }
      // Customer stays on current page (store)
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    }
  }, [setSession, navigate]);



  const handleLogout = useCallback(() => {
    setSession(null);
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    toast.success('Logged out successfully!');
    navigate('/');
  }, [setSession, navigate]);



  const handleSignupSubmit = useCallback(async (userData) => {
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('password', userData.password);
      
      // Set default user_type to 10 (customer)
      formData.append('user_type', '10');
      
      // Append image if provided
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

      console.log('Signup successful, user data:', data.user);

      // Set session with user data from backend
      setSession(data.user);
      toast.success(data.message || 'Account created successfully!');
      setIsSignupModalOpen(false);

      // Customers stay on store pages, so no navigation needed
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    }
  }, [setSession]);

  return (
    <>
    <header className="mars-header">
      <div className="mars-header-top">
        <a href="#" className="mars-logo">
          MARS
        </a>

        <form className="mars-search-form">
          <input
            className="mars-search-input"
            type="text"
            placeholder="Search for Products"
            value={searchText}
            onChange={saveSearch}
            onKeyDown={clickedKey}
          />

          {isLoggedIn ? (
            <button type="button" className="mars-header-button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
          <>
          <button type="button" className="mars-header-button" onClick={() => setIsLoginModalOpen(true)}>
            Login
          </button>

          <button type="button" className="mars-header-button" onClick={() => setIsSignupModalOpen(true)}>
            Signup
          </button>
          </>
          )}
          <Link to="/storeCart">
            <button type="button" className="mars-header-button">Cart</button>
          </Link>

        </form>
      </div>

      <nav className="mars-nav">
        <ul className="mars-nav-list">
          <li><a href="#" className="mars-nav-link">Mobile</a></li>
          <li><a href="#" className="mars-nav-link">Laptops</a></li>
          <li><a href="#" className="mars-nav-link">Accessories</a></li>
          <li><a href="#" className="mars-nav-link">Consoles</a></li>
        </ul>
      </nav>
    </header>

    <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSubmit={handleLoginSubmit}
    />
    <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSubmit={handleSignupSubmit}
    />

    </>
  );
}
