import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import StoreApi from '../../services/storeApi';
import { useLocalSession } from '../../hooks/useLocalSession';
import { useItemViewTracking } from '../../hooks/useItemViewTracking';
import '../../styles/MobileStore.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { currentUser } = useLocalSession();
  const isLoggedIn = !!currentUser;

  useItemViewTracking(id);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const fetchedProduct = await StoreApi.getItemById(id);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        setMainImage(fetchedProduct.imgs?.[0] || fetchedProduct.img);
      } else {
        setError('Product not found');
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const increaseQty = () => setQuantity(q => q + 1);
  const decreaseQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  async function addToCart() {
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
          quantity: quantity,
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
          <p>Loading product...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-error">
          <p>{error || 'Product not found.'}</p>
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
      
      <div className="mobile-product-detail">
        <button className="mobile-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        <div className="mobile-product-images">
          <div className="mobile-product-main-image">
            <img src={mainImage} alt={product.name} />
          </div>
          
          <div className="mobile-product-thumbnails">
            {(product.imgs || [product.img]).map((img, index) => (
              <button
                key={index}
                className={`mobile-thumb-btn ${img === mainImage ? 'active' : ''}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-product-info">
          <h1>{product.name}</h1>
          <div className="mobile-product-price">${product.price}</div>
          
          {product.description && (
            <div className="mobile-product-description">
              <h2>Description</h2>
              <p>{product.description}</p>
            </div>
          )}

          {isLoggedIn && (
            <div className="mobile-product-actions">
              <div className="mobile-qty-selector">
                <button onClick={decreaseQty} className="mobile-qty-btn">
                  <Minus size={20} />
                </button>
                <span className="mobile-qty-value">{quantity}</span>
                <button onClick={increaseQty} className="mobile-qty-btn">
                  <Plus size={20} />
                </button>
              </div>

              <button className="mobile-btn-primary mobile-add-cart-btn" onClick={addToCart}>
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            </div>
          )}

          {!isLoggedIn && (
            <div className="mobile-login-prompt">
              <p>Please login to purchase this product</p>
            </div>
          )}
        </div>
      </div>

      <MobileStoreFooter />
    </div>
  );
}
