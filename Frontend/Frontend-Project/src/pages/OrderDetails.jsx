import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
import { useLocalSession } from "../hooks/useLocalSession";
import toast from "react-hot-toast";
import "../styles/cart.css";

export default function OrderDetails() {
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { orderId } = useParams();
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) {
      toast.error("Please login to view order details");
      navigate("/");
      return;
    }
    fetchOrderDetails();
  }, [orderId, currentUser, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const orderResponse = await fetch(`http://localhost:5000/api/orders/${orderId}`);
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        toast.error(orderData.message || "Failed to load order");
        navigate("/my-orders");
        return;
      }

      if (orderData.order.user_id !== currentUser.id) {
        toast.error("You don't have permission to view this order");
        navigate("/my-orders");
        return;
      }

      setOrder(orderData.order);

      const itemsResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/items`);
      const itemsData = await itemsResponse.json();

      if (itemsData.success) {
        setOrderItems(itemsData.items);
      } else {
        toast.error("Failed to load order items");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Error loading order details");
      navigate("/my-orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "pending":
        return "#FFA726";
      case "shipped":
        return "#42A5F5";
      case "rejected":
        return "#EF5350";
      default:
        return "#999";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="mars-page">
        <Header />
        <div className="cart-container">
          <div className="empty-cart">Loading order details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mars-page">
        <Header />
        <div className="cart-container">
          <div className="empty-cart">Order not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mars-page">
      <Header />

      <div className="cart-container">
        <button
          onClick={() => navigate("/my-orders")}
          style={{
            background: "transparent",
            border: "1px solid #42A5F5",
            color: "#42A5F5",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ← Back to Orders
        </button>

        <h1 style={{ color: "white", marginBottom: "20px", fontSize: "28px" }}>
          Order #{order.id}
        </h1>

        <div
          className="cart-product"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "15px",
            }}
          >
            <div>
              <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                Total Amount
              </div>
              <div style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
                ${parseFloat(order.total_amount).toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                Status
              </div>
              <div
                style={{
                  color: getStatusColor(order.status),
                  fontSize: "18px",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                }}
              >
                {order.status}
              </div>
            </div>

            <div>
              <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                Order Date
              </div>
              <div style={{ color: "white", fontSize: "14px" }}>
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "15px", borderTop: "1px solid #333" }}>
            <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
              Billing Address
            </div>
            <div style={{ color: "white", fontSize: "14px" }}>
              {order.billing_address}
            </div>
          </div>

          {order.reason_for_decline && (
            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
              <div style={{ color: "#EF5350", fontSize: "14px", marginBottom: "5px" }}>
                Reason for Decline
              </div>
              <div style={{ color: "#EF5350", fontSize: "14px" }}>
                {order.reason_for_decline}
              </div>
            </div>
          )}
        </div>

        <h2 style={{ color: "white", marginBottom: "15px", fontSize: "22px" }}>
          Order Items
        </h2>

        {orderItems.length === 0 ? (
          <div className="empty-cart">No items found in this order.</div>
        ) : (
          <>
            {orderItems.map((item, index) => (
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
                  ${parseFloat(item.price).toFixed(2)}
                </div>

                <div className="cart-product-quantity">
                  quantity: <br />
                  {item.quantity}
                </div>

                <div className="cart-product-subtotal">
                  subtotal: <br />
                  ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            <div className="cart-total">
              <div className="cart-total-row">
                <span className="cart-total-label">Total:</span>
                <span className="cart-total-value">
                  ${parseFloat(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
