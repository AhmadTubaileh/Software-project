import React,{useState, useCallback, useEffect} from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import LoginModal from './StoreLoginForm';
import SignupModal from './StoreSignupForm';
import { useLocalSession } from '../../hooks/useLocalSession';
import toast from 'react-hot-toast';

export default function Header() {
  const [searchText, setSearchText] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { currentUser, setSession } = useLocalSession();
  const isLoggedIn = !!currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine if we should show the search bar
  const showSearch = location.pathname === '/store' || location.pathname.startsWith('/category/');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  function saveSearch(event) {
    const value = event.target.value;
    setSearchText(value);
    
    // Update URL search params
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  }

  function clickedKey(event) {
    if (event.key === "Enter") {
      console.log(searchText);
    }
  }

  // Sync search text with URL params on mount and location change
  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    setSearchText(searchParam);
  }, [location.pathname, searchParams]);

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
      // Admin (role 0) and Employee (role 1-9) go to store home (/)
      // Customer stays on store pages
      if (data.user.role === 'admin' || data.user.role === 'employee') {
        navigate('/pos');
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
        <Link to="/store" style={{ textDecoration: 'none' }}>
          <p className="mars-logo">
            MARS
          </p>
        </Link>

        <form className="mars-search-form">
          {showSearch && (
            <input
              className="mars-search-input"
              type="text"
              placeholder="Search for Products"
              value={searchText}
              onChange={saveSearch}
              onKeyDown={clickedKey}
            />
          )}

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
          
          {isLoggedIn && (
          <>
            <Link to="/storeCart">
              <button type="button" className="mars-header-button">Cart</button>
            </Link>
            <Link to="/my-installments">
              <button type="button" className="mars-header-button">My Installments</button>
            </Link>
            <Link to="/my-orders">
              <button type="button" className="mars-header-button">My Orders</button>
            </Link>
          </>
          )}

        </form>
      </div>

      <nav className="mars-nav">
        <ul className="mars-nav-list">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={`/category/${category.slug}`} className="mars-nav-link">
                {category.name}
              </Link>
            </li>
          ))}
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
