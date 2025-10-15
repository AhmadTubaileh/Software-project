import React, { useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import AdminToolbar from '../components/AdminToolbar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import LoginForm from '../components/LoginForm.jsx';
import SignUpForm from '../components/SignUpForm.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { PRODUCTS } from '../data/products.js';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { filterProducts } from '../utils/filterProducts.js';

function Home() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [paymentPrefById, setPaymentPrefById] = useState({});
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const { currentUser, setSession, clearSession } = useLocalSession();

  const filtered = useMemo(() => filterProducts(PRODUCTS, query, sortBy), [query, sortBy]);

  function setPaymentPref(productId, pref) {
    setPaymentPrefById(prev => ({ ...prev, [productId]: pref }));
  }

  function onAddToCart(product) {
    if (!currentUser) { setAuthModal('login'); return; }
    const pref = paymentPrefById[product.id] || 'cash';
    toast.success(`${product.name} added (${pref})`);
  }

  return (
    <div className="home-page">
      <Toaster position="top-center" />
      <Header
        query={query}
        setQuery={setQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        currentUser={currentUser}
        onLogin={() => setAuthModal('login')}
        onSignup={() => setAuthModal('signup')}
        onLogout={clearSession}
      />

      {currentUser && currentUser.role === 'admin' && <AdminToolbar />}

      <section className="home-grid">
        {filtered.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            paymentPref={paymentPrefById[product.id] || 'cash'}
            onSetPayment={setPaymentPref}
            onAddToCart={onAddToCart}
          />
        ))}
      </section>

      {authModal && (
        <Modal title={authModal === 'login' ? 'Log in' : 'Create your account'} onClose={() => setAuthModal(null)}>
          {authModal === 'login' ? (
            <>
            <LoginForm onSubmit={({ username, password }) => {
              if (username === 'admin' && password === '472003') {
                setSession({ id: '1', username: 'admin', role: 'admin' });
              } else {
                setSession({ id: '2', username: username || 'customer', role: 'customer' });
              }
              setAuthModal(null);
            }} />
            <div style={{ marginTop: 12, color: '#8aa0c7', fontSize: 12 }}>
              No account? <button className="btn btn-outline" onClick={() => setAuthModal('signup')}>Sign up</button>
            </div>
            </>
          ) : (
            <>
            <SignUpForm onSubmit={({ username, email }) => {
              setSession({ id: String(Date.now()), username: username || email || 'customer', role: 'customer' });
              setAuthModal(null);
            }} />
            <div style={{ marginTop: 12, color: '#8aa0c7', fontSize: 12 }}>
              Have an account? <button className="btn btn-outline" onClick={() => setAuthModal('login')}>Log in</button>
            </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Home;


