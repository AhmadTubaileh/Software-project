import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useLocalSession();

  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        setLoading(true);
        
        const selectedBranchId = localStorage.getItem('selectedBranchId');
        
        if (!selectedBranchId) {
          setError('Please select a branch first.');
          setLoading(false);
          return;
        }
        
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        const categoriesData = await categoriesResponse.json();
        
        if (!categoriesData.success) {
          throw new Error('Failed to fetch categories');
        }
        
        const category = categoriesData.categories.find(cat => cat.slug === slug);
        
        if (!category) {
          setError('Category not found');
          setLoading(false);
          return;
        }
        
        setCategoryName(category.name);
        
        const itemsResponse = await fetch(`http://localhost:5000/api/store/items?category_id=${category.id}&branch_id=${selectedBranchId}`);
        const itemsData = await itemsResponse.json();
        
        if (itemsData.success) {
          setItems(itemsData.items);
        } else {
          throw new Error(itemsData.message || 'Failed to fetch items');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching category items:', err);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryItems();
  }, [slug]);

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
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading items...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-error">
          <p>{error}</p>
          <button onClick={() => navigate('/store')} className="mobile-btn-primary">
            Back to Store
          </button>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <MobileStoreHeader />
      
      <div className="mobile-category-page">
        <div className="mobile-category-header">
          <button className="mobile-back-btn" onClick={() => navigate('/store')}>
            <ArrowLeft size={24} />
          </button>
          <h1>{categoryName}</h1>
        </div>

        {items.length === 0 ? (
          <div className="mobile-empty-state">
            <p>No items available in this category.</p>
          </div>
        ) : (
          <div className="mobile-products-grid">
            {items.map((product) => (
              <div key={product.id} className="mobile-product-card">
                <div 
                  className="mobile-product-card-image"
                  onClick={() => navigate(`/store/product/${product.id}`)}
                >
                  <img src={product.img} alt={product.name} />
                </div>
                
                <div className="mobile-product-card-info">
                  <h3 onClick={() => navigate(`/store/product/${product.id}`)}>
                    {product.name}
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
        )}
      </div>

      <MobileStoreFooter />
    </div>
  );
}
