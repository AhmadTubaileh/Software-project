import React,{useState} from "react";
import { Link } from "react-router-dom";
import LoginModal from './StoreLoginForm';

export default function Header() {
  const [searchText, setSearchText] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  function saveSearch(event) {
    setSearchText(event.target.value);
  }

  function clickedKey(event) {
    if (event.key === "Enter") {
      console.log(searchText);
    }
  }

  const handleLoginSubmit = (credentials) => {
    console.log('Login attempt with:', credentials);
    // Add your login logic here (API call, authentication, etc.)
    // For example:
    // try {
    //   const response = await api.login(credentials);
    //   localStorage.setItem('token', response.token);
    //   setIsLoggedIn(true);
    // } catch (error) {
    //   console.error('Login failed:', error);
    // }
  };

  function signup() {
    // TODO: open signup modal
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

          <button type="button" className="mars-header-button" onClick={signup}>
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

    </>
  );
}
