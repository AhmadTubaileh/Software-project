import React from 'react';

function Header({ query, setQuery, sortBy, setSortBy, currentUser, onLogin, onSignup, onLogout }) {
  return (
    <header className="site-header sticky top-0 z-10 flex items-center gap-3 px-4 py-3 mb-4 bg-gradient-to-b from-[#111a2e]/90 to-[#0b1020]/90 backdrop-blur border-b border-brand/15">
      <div className="site-header__left">
        <div className="logo text-white font-black tracking-wide" aria-label="Electronic Store logo">⚡ ElectroMart</div>
      </div>
      <div className="site-header__center flex-1 flex items-center gap-2">
        <input className="search-input flex-1 px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white outline-none focus:ring-4 ring-brand/20" placeholder="Search phones, laptops, TVs..." value={query} onChange={e => setQuery(e.target.value)} />
        <select className="sort-select px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>
      <div className="site-header__right inline-flex items-center gap-2">
        {currentUser ? (
          <>
            {currentUser.role === 'admin' && <span className="badge-admin inline-flex items-center gap-1 px-3 py-1 rounded-full border border-brand/35 bg-[#0d1730]">Admin</span>}
            <span className="welcome-text text-slate-300">Hi, {currentUser.username}</span>
            <button className="btn btn-outline px-4 py-2 rounded-lg border border-brand/35 bg-[#0e1830] text-white hover:-translate-y-px transition" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn btn-outline px-4 py-2 rounded-lg border border-brand/35 bg-[#0e1830] text-white hover:-translate-y-px transition" onClick={onLogin}>Log in</button>
            <button className="btn btn-primary px-4 py-2 rounded-lg border border-brand bg-brand text-white shadow-lg hover:brightness-105 transition" onClick={onSignup}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;


