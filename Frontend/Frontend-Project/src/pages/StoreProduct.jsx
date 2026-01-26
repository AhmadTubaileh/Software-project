import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
import StoreApi from "../services/storeApi";
import StoreInstallmentModal from "../components/StoreProduct/StoreInstallmentModal";
import { useLocalSession } from "../hooks/useLocalSession";
import { useItemViewTracking } from "../hooks/useItemViewTracking";
import RelatedItems from "../components/store/RelatedItems";
import toast from "react-hot-toast";


export default function StoreProduct() {
  const { id } = useParams(); //  /store/product/:id
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { currentUser } = useLocalSession();
  const isLoggedIn = !!currentUser;

  useItemViewTracking(id);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const fetchedProduct = await StoreApi.getItemById(id);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          setMainImage(fetchedProduct.imgs?.[0] || fetchedProduct.img);
        } else {
          setError("Product not found");
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ color: "white", padding: "20px", textAlign: "center" }}>Loading product...</div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div style={{ color: "white", padding: "20px", textAlign: "center" }}>
          {error || "Product not found."}
        </div>
        <Footer />
      </>
    );
  }

  function increaseQty() {
    setQuantity((q) => q + 1);
  }

  function decreaseQty() {
    setQuantity((q) => (q > 1 ? q - 1 : 1));
  }

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
      } else {
        toast.error(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    }
  }
  /*const handleInstallmentSubmit = (credentials) => {
    console.log('installment attempt with:', credentials);
    // Add your installment logic here (API call, authentication, etc.)
    // For example:
    // try {
    //   const response = await api.login(credentials);
    //   localStorage.setItem('token', response.token);
    //   setIsLoggedIn(true);
    // } catch (error) {
    //   console.error('Login failed:', error);
    // }
  };
*/
 
  return (
    <>
      <Header />

      <div className="mars-product-page">
        {/* left: main image + images */}
        <div className="mars-product-left">
          <div className="mars-product-main-image">
            <img src={mainImage} alt={product.name} />
          </div>

          <div className="mars-product-thumbnails">
            {(product.imgs || [product.img]).map((img, index) => (
              <button
                key={index}
                className={`mars-thumb-btn ${img === mainImage ? "active" : ""}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* right: info + order section */}
        <div className="mars-product-right">
          <h1 className="mars-product-title">{product.name}</h1>
          <div className="mars-product-price">${product.price}</div>


          {/* order section */}
          {isLoggedIn && (
          <div className="mars-order-box">
            {/* first line: quantity + add to cart */}
            <div className="mars-order-row">
              <div className="mars-qty-box">
                <button className="mars-qty-btn" onClick={decreaseQty}>-</button>
                <span className="mars-qty-value">{quantity}</span>
                <button className="mars-qty-btn" onClick={increaseQty}>+</button>
              </div>

              <button className="mars-order-add-btn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>

            {/* second line: installment */}
            {(Number(product.installment) === 1) &&(
              <div className="mars-order-row">
                <button 
                  className="mars-order-installment-btn" 
                  onClick={() => {
                    if (!currentUser) {
                      toast.error('Please login to apply for installments');
                      return;
                    }
                    setIsInstallmentModalOpen(true);
                  }}
                >
                  Buy in Installments
                </button>
              </div>
            )}
          </div>
          )}

          {/* description */}
          <div className="mars-product-description">
            <h2>Description</h2>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      <RelatedItems currentItemId={id} />

      <Footer />

      {/* Installment Modal */}
      <StoreInstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        product={product}
        quantity={quantity}
      />

    </>
  );
}
