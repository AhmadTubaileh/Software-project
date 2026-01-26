import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import StoreApi from '../../services/storeApi';
import RecommendationApi from '../../services/recommendationApi';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function MobileProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [currentUser]);

  async function fetchProducts() {
    try {
      setLoading(true);
      
      const selectedBranchId = localStorage.getItem('selectedBranchId');
      
      if (!selectedBranchId) {
        setError('Please select a branch first.');
        setLoading(false);
        return;
      }
      
      const allItems = await StoreApi.getItems(selectedBranchId);
      setProducts(allItems);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(product) {
    if (!currentUser || !currentUser.id) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: product.id,
          quantity: 1,
          paymentPreference: 'cash'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${product.name} added to cart!`);
        navigate('/store/cart');
      } else {
        toast.error(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    }
  }

  if (loading) {
    return (
      <div className="mobile-store-loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-store-error">
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mobile-empty-state">
        <p>No products available.</p>
      </div>
    );
  }

  return (
    <div className="mobile-products-section">
      <h2 className="mobile-products-title">
        All Products
      </h2>
      <div className="mobile-products-grid">
        {products.map((product) => (
          <div key={product.id} className="mobile-product-card">
            <Link to={`/store/product/${product.id}`} className="mobile-product-card-image">
              <img src={product.img} alt={product.name} />
            </Link>
            
            <div className="mobile-product-card-info">
              <h3>
                <Link to={`/store/product/${product.id}`}>{product.name}</Link>
              </h3>
              <p className="mobile-product-card-price">${product.price}</p>
              
              {currentUser && (
                <button 
                  className="mobile-product-card-btn"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
