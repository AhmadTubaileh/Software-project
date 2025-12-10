import React from "react";
import { Link } from "react-router-dom";


export default function Header() {
  const [searchText, setSearchText] = React.useState("");

  function saveSearch(event) {
    setSearchText(event.target.value);
  }

  function clickedKey(event) {
    if (event.key === "Enter") {
      console.log(searchText);
    }
  }

  function login() {
    // TODO: open login modal
  }

  function signup() {
    // TODO: open signup modal
  }

  return (
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

          <button type="button" className="mars-header-button" onClick={login}>
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
  );
}
