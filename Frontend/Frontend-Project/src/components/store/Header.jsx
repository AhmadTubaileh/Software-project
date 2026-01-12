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
  const { setSession } = useLocalSession();
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

  

  const handleSignupSubmit = (credentials) => {
    console.log('Signup attempt with:', credentials);
    // Add your signup logic here (API call, authentication, etc.)
    // For example:
    // try {
    //   const response = await api.signup(credentials);
    //   localStorage.setItem('token', response.token);
    //   setIsLoggedIn(true);
    // } catch (error) {
    //   console.error('Signup failed:', error);
    // }
  }

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

          <button type="button" className="mars-header-button" onClick={() => setIsLoginModalOpen(true)}>
            Login
          </button>

          <button type="button" className="mars-header-button" onClick={() => setIsSignupModalOpen(true)}>
            Signup
          </button>

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
