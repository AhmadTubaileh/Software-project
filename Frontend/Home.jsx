// Using CDN React/ReactDOM via index.html; no imports needed here
const { useMemo, useState } = React;

// Standalone Home page (for review). Not wired into the running app yet.
// You can later move this into my-first-app/src/pages and import in App.js.

const MOCK_PRODUCTS = [
  { id: 'p-1', name: 'Smartphone X1', brand: 'Acme', price: 399, category: 'phone' },
  { id: 'p-2', name: 'Laptop Pro 14"', brand: 'Acme', price: 1199, category: 'laptop' },
  { id: 'p-3', name: 'Noise-Cancel Headphones', brand: 'Acme', price: 149, category: 'headphones' },
  { id: 'p-4', name: '4K TV 55"', brand: 'Acme', price: 699, category: 'tv' },
  { id: 'p-5', name: 'Gaming Console Z', brand: 'Acme', price: 499, category: 'console' },
  { id: 'p-6', name: 'Smartwatch S', brand: 'Acme', price: 199, category: 'watch' },
];

function getCategoryIcon(category) {
  switch (category) {
    case 'phone':
      return '📱';
    case 'laptop':
      return '💻';
    case 'headphones':
      return '🎧';
    case 'tv':
      return '📺';
    case 'console':
      return '🎮';
    case 'watch':
      return '⌚';
    default:
      return '🔌';
  }
}

function Home() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance'); // 'price-asc' | 'price-desc'
  const [paymentPrefById, setPaymentPrefById] = useState({}); // { [productId]: 'cash' | 'installment' }
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('frontend_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function setSession(user) {
    setCurrentUser(user);
    try { localStorage.setItem('frontend_user', JSON.stringify(user)); } catch {}
  }

  function clearSession() {
    setCurrentUser(null);
    try { localStorage.removeItem('frontend_user'); } catch {}
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter(p =>
          p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        );
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [query, sortBy]);

  function setPaymentPref(productId, pref) {
    setPaymentPrefById(prev => ({ ...prev, [productId]: pref }));
  }

  function onAddToCart(product) {
    const pref = paymentPrefById[product.id] || 'cash';
    // In the real app: add { ...product, paymentPreference: pref } to cart context
    // For now, log action for UX demonstration
    // eslint-disable-next-line no-console
    console.log('Add to cart:', { productId: product.id, paymentPreference: pref });
    alert(`${product.name} added to cart with ${pref.toUpperCase()} payment`);
  }

  return (
    <div className="home-page">
      <header className="site-header sticky top-0 z-10 flex items-center gap-3 px-4 py-3 mb-4 bg-gradient-to-b from-[#111a2e]/90 to-[#0b1020]/90 backdrop-blur border-b border-brand/15">
        <div className="site-header__left">
          <div className="logo text-white font-black tracking-wide" aria-label="Electronic Store logo">⚡ ElectroMart</div>
        </div>
        <div className="site-header__center flex-1 flex items-center gap-2">
          <input
            className="search-input flex-1 px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white outline-none focus:ring-4 ring-brand/20"
            placeholder="Search phones, laptops, TVs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="sort-select px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
        <div className="site-header__right">
          {currentUser ? (
            <>
              {currentUser.role === 'admin' && <span className="badge-admin inline-flex items-center gap-1 px-3 py-1 rounded-full border border-brand/35 bg-[#0d1730]">Admin</span>}
              <span className="welcome-text text-slate-300">Hi, {currentUser.username}</span>
              <button className="btn btn-outline px-4 py-2 rounded-lg border border-brand/35 bg-[#0e1830] text-white hover:-translate-y-px transition" onClick={clearSession}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline px-4 py-2 rounded-lg border border-brand/35 bg-[#0e1830] text-white hover:-translate-y-px transition" onClick={() => setAuthModal('login')}>Log in</button>
              <button className="btn btn-primary px-4 py-2 rounded-lg border border-brand bg-brand text-white shadow-lg hover:brightness-105 transition" onClick={() => setAuthModal('signup')}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {currentUser && currentUser.role === 'admin' && (
        <section className="admin-toolbar flex flex-wrap gap-2 my-2" aria-label="Admin actions">
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Dashboard</button>
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">POS</button>
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Inventory</button>
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Orders</button>
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Service Tickets</button>
          <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Users & Roles</button>
        </section>
      )}

      <section className="home-grid">
        {filtered.map(product => {
          const pref = paymentPrefById[product.id] || 'cash';
          return (
            <article key={product.id} className="product-card transition-transform">
              <div className="product-icon" aria-hidden="true">{getCategoryIcon(product.category)}</div>
              <div className="product-body">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-brand">{product.brand}</p>
                <p className="product-price">${product.price}</p>

                <div className="payment-toggle" role="group" aria-label="Payment preference">
                  <label className={pref === 'cash' ? 'active' : ''}>
                    <input
                      type="radio"
                      name={`pay-${product.id}`}
                      checked={pref === 'cash'}
                      onChange={() => setPaymentPref(product.id, 'cash')}
                    />
                    Cash
                  </label>
                  <label className={pref === 'installment' ? 'active' : ''}>
                    <input
                      type="radio"
                      name={`pay-${product.id}`}
                      checked={pref === 'installment'}
                      onChange={() => setPaymentPref(product.id, 'installment')}
                    />
                    Installment
                  </label>
                </div>

                <button className="add-to-cart px-3 py-2 rounded-lg border border-brand bg-brand text-white shadow hover:brightness-105 transition" onClick={() => onAddToCart(product)}>
                  Add to Cart
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {authModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h2>{authModal === 'login' ? 'Log in' : 'Create your account'}</h2>
              <button className="modal-close" onClick={() => setAuthModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {authModal === 'login' ? (
                React.createElement(LoginForm, { onSubmit: ({ username, password }) => {
                  if (username === 'admin' && password === '472003') {
                    setSession({ id: '1', username: 'admin', role: 'admin' });
                    setAuthModal(null);
                    return;
                  }
                  setSession({ id: '2', username: username || 'customer', role: 'customer' });
                  setAuthModal(null);
                }})
              ) : (
                React.createElement(SignUpForm, { onSubmit: ({ username }) => {
                  setSession({ id: String(Date.now()), username: username || 'customer', role: 'customer' });
                  setAuthModal(null);
                }})
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Expose for potential reuse; also render from index.html
window.Home = Home;

