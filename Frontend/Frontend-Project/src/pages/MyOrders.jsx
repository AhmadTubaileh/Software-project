import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
import { useLocalSession } from "../hooks/useLocalSession";
import toast from "react-hot-toast";
import "../styles/cart.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) {
      toast.error("Please login to view your orders");
      navigate("/");
      return;
    }
    fetchOrders();
  }, [currentUser, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/orders/user/${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error loading orders");
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
          <div className="empty-cart">Loading orders...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mars-page">
      <Header />

      <div className="cart-container">
        <h1 style={{ color: "white", marginBottom: "20px", fontSize: "28px" }}>
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="empty-cart">You haven't placed any orders yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((order) => (
              <div
                key={order.id}
                className="cart-product"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px",
                }}
                onClick={() => navigate(`/order/${order.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "15px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                      Order ID
                    </div>
                    <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
                      #{order.id}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                      Total Amount
                    </div>
                    <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
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
                        fontSize: "16px",
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                    >
                      {order.status}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                      Date
                    </div>
                    <div style={{ color: "white", fontSize: "14px" }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                  <div style={{ color: "#999", fontSize: "14px", marginBottom: "5px" }}>
                    Billing Address
                  </div>
                  <div style={{ color: "white", fontSize: "14px" }}>
                    {order.billing_address}
                  </div>
                </div>

                {order.reason_for_decline && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #333" }}>
                    <div style={{ color: "#EF5350", fontSize: "14px", marginBottom: "5px" }}>
                      Reason for Decline
                    </div>
                    <div style={{ color: "#EF5350", fontSize: "14px" }}>
                      {order.reason_for_decline}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "15px",
                    color: "#42A5F5",
                    fontSize: "14px",
                    textAlign: "right",
                  }}
                >
                  Click to view order details →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
