import React from "react";
import { useParams } from "react-router-dom";
import { storeProducts } from "../data/storeProducts";
import { cartProducts } from "../data/cartProducts";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
//import InstallmentModal from "../components/StoreProduct/StoreInstallmentModal";


export default function StoreProduct() {
  const { id } = useParams(); //  /store/product/:id
  const product = storeProducts.find((p) => p.id === id);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = React.useState(false);
  const [mainImage, setMainImage] = React.useState(product?.imgs?.[0] || product?.img);
  const [quantity, setQuantity] = React.useState(1);

  if (!product) {
    return <div style={{ color: "white", padding: "20px" }}>Product not found.</div>;
  }

  function increaseQty() {
    setQuantity((q) => q + 1);
  }

  function decreaseQty() {
    setQuantity((q) => (q > 1 ? q - 1 : 1));
  }

  function addToCart() {
    cartProducts.push({
      id: product.id,
      img: product.img,
      name: product.name,
      price: product.price,
      quantity: quantity,
      subtotal: product.price * quantity
    });
  }
  const handleInstallmentSubmit = (credentials) => {
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
            <div className="mars-order-row">
              <button className="mars-order-installment-btn" onClick={()=>setIsInstallmentModalOpen(true)}>
                Buy in Installments
              </button>
            </div>
          </div>

          {/* description */}
          <div className="mars-product-description">
            <h2>Description</h2>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      <Footer />


      {/* installment modal */}
      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        onInstallmentSubmit={handleInstallmentSubmit}
    />
    </>
  );
}
