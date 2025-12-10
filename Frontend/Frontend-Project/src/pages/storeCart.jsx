import React from "react";
import { cartProducts as initialCartProducts } from "../data/cartProducts";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
import "../styles/cart.css";


export default function StoreCart() {
  const [cartItems, setCartItems] = React.useState(initialCartProducts);

  // (optional) if you want to reuse the total below
  const total = cartItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  function delet(itemToDelete){
    setCartItems(copy =>
      copy.filter(item => item.id !== itemToDelete.id)
    )
  }

  return (
    <div className="mars-page">
      <Header />

      <div className="cart-container">
        {cartItems.length === 0 ? (

          <div className="empty-cart">Your cart is empty.</div>
        ) : (
          <>
            {/* MAPPING CART PRODUCTS */}
            {cartItems.map((item, index) => (
              <div key={index} className="cart-product">

                <div className="cart-product-img">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="cart-product-name">
                  name: <br />
                  {item.name}
                </div>

                <div className="cart-product-price">
                  price: <br />
                  ${item.price}
                </div>

                <div className="cart-product-quantity">
                  quantity: <br />
                  {item.quantity}
                </div>

                <div className="cart-product-subtotal">
                  subtotal: <br />
                  ${item.subtotal}
                </div>

                <div className="cart-product-delete">
                  <button
                    className="cart-delete-btn"
                    onClick={() => delet(item)}
                    aria-label="Remove item"
                  >
                    ❌
                  </button>
                </div>


              </div>
            ))}

            {/* TOTAL SECTION (if cart item exists it will be visible) */}
            <div className="cart-total">
              <div className="cart-total-row">
                <span className="cart-total-label">Subtotal:</span>
                <span className="cart-total-value">
                  ${total}
                </span>
              </div>

              <button className="cart-checkout-btn">
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
