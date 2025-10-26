import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import LoginForm from '../components/LoginForm.jsx';
import SignUpForm from '../components/SignUpForm.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { PRODUCTS } from '../data/products.js';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { filterProducts } from '../utils/filterProducts.js';
import AdminSidebar from '../components/AdminSidebar.jsx';

function Home() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [paymentPrefById, setPaymentPrefById] = useState({});
  const [authModal, setAuthModal] = useState(null);
  const { currentUser, setSession, clearSession } = useLocalSession();

  // Optimized product filtering with useMemo
  const filtered = useMemo(() => 
    filterProducts(PRODUCTS, query, sortBy),
    [query, sortBy]
  );

  // Optimized callbacks with useCallback
  const setPaymentPref = useCallback((productId, pref) => {
    setPaymentPrefById(prev => ({ ...prev, [productId]: pref }));
  }, []);

  const onAddToCart = useCallback((product) => {
    if (!currentUser) {
      setAuthModal('login');
      return;
    }
    const pref = paymentPrefById[product.id] || 'cash';
    toast.success(`${product.name} added (${pref})`);
  }, [currentUser, paymentPrefById]);

  const handleLogin = useCallback(({ username, password }) => {
    if (username === 'admin' && password === '472003') {
      setSession({ id: '1', username: 'admin', role: 'admin' });
    } else {
      setSession({ id: '2', username: username || 'customer', role: 'customer' });
    }
    setAuthModal(null);
  }, [setSession]);

  const handleSignup = useCallback(({ username, email }) => {
    setSession({
      id: String(Date.now()),
      username: username || email || 'customer',
      role: 'customer',
    });
    setAuthModal(null);
  }, [setSession]);

  const openLoginModal = useCallback(() => setAuthModal('login'), []);
  const openSignupModal = useCallback(() => setAuthModal('signup'), []);
  const closeAuthModal = useCallback(() => setAuthModal(null), []);

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar for Admin */}
      {currentUser && currentUser.role === 'admin' && <AdminSidebar />}

      {/* Main Area */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 transform-gpu ${
          currentUser && currentUser.role === 'admin' ? 'ml-64' : ''
        }`}
      >
        <div className="p-6 flex-1">
          <Header
            query={query}
            setQuery={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentUser={currentUser}
            onLogin={openLoginModal}
            onSignup={openSignupModal}
            onLogout={clearSession}
          />

          {/* Product grid with POS-style animations */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 transform-gpu">
            {filtered.map(product => (
              <div 
                key={product.id}
                className="transform-gpu transition-all duration-300 hover:scale-105 hover:rotate-1"
              >
                <ProductCard
                  product={product}
                  paymentPref={paymentPrefById[product.id] || 'cash'}
                  onSetPayment={setPaymentPref}
                  onAddToCart={onAddToCart}
                />
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Auth Modal */}
      {authModal && (
        <Modal
          title={authModal === 'login' ? 'Log in' : 'Create your account'}
          onClose={closeAuthModal}
        >
          {authModal === 'login' ? (
            <>
              <LoginForm onSubmit={handleLogin} />
              <div className="mt-3 text-sm text-blue-400">
                No account?{' '}
                <button
                  className="underline hover:text-blue-300 transition-all duration-200 hover:scale-105"
                  onClick={() => setAuthModal('signup')}
                >
                  Sign up
                </button>
              </div>
            </>
          ) : (
            <>
              <SignUpForm onSubmit={handleSignup} />
              <div className="mt-3 text-sm text-blue-400">
                Have an account?{' '}
                <button
                  className="underline hover:text-blue-300 transition-all duration-200 hover:scale-105"
                  onClick={() => setAuthModal('login')}
                >
                  Log in
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export default React.memo(Home);