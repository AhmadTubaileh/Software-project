import React, { useMemo, useState, useCallback } from 'react';
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

  // UPDATED: Login handler - ALL logins go to backend
  const handleLogin = useCallback(async ({ username, password }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Set session with user data from backend
      setSession(data.user);
      toast.success('Login successful!');
      setAuthModal(null);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    }
  }, [setSession]);

  // UPDATED: Signup handler with backend API
  const handleSignup = useCallback(async (userData) => {
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
      setAuthModal(null);
      
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    }
  }, [setSession]);

  const openLoginModal = useCallback(() => setAuthModal('login'), []);
  const openSignupModal = useCallback(() => setAuthModal('signup'), []);
  const closeAuthModal = useCallback(() => setAuthModal(null), []);

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar for Admin AND Employees (levels 0-9) */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      {/* Main Area */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 transform-gpu ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
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

          
          {/* Show welcome message for employee */}
          {currentUser && currentUser.role === 'employee' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg border border-green-400">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍💼</span>
                <div>
                  <h3 className="font-bold text-lg">Employee Access</h3>
                  <p className="text-green-100 text-sm">Level {currentUser.user_type} employee privileges</p>
                </div>
              </div>
            </div>
          )}

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