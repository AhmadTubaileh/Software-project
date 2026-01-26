import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();

  useEffect(() => {
    if (!currentUser?.id) {
      toast.error('Please login to view order details');
      navigate('/');
      return;
    }
    fetchOrderDetails();
  }, [orderId, currentUser, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        if (data.order.user_id !== currentUser.id) {
          toast.error('Unauthorized access');
          navigate('/store/my-orders');
          return;
        }
        setOrder(data.order);
      } else {
        toast.error(data.message || 'Failed to load order details');
        navigate('/store/my-orders');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error loading order details');
      navigate('/store/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FFA726';
      case 'shipped':
        return '#42A5F5';
      case 'rejected':
        return '#EF5350';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-error">
          <p>Order not found</p>
          <button onClick={() => navigate('/store/my-orders')} className="mobile-btn-primary">
            Back to Orders
          </button>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <MobileStoreHeader />
      
      <div className="mobile-order-details-page">
        <div className="mobile-order-details-header">
          <button className="mobile-back-btn" onClick={() => navigate('/store/my-orders')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Order Details</h1>
        </div>

        <div className="mobile-order-details-card">
          <div className="mobile-order-details-status-section">
            <div className="mobile-order-details-id">
              <Package size={24} />
              <span>Order #{order.id}</span>
            </div>
            <div 
              className="mobile-order-details-status"
              style={{ 
                backgroundColor: `${getStatusColor(order.status)}20`,
                color: getStatusColor(order.status)
              }}
            >
              {order.status}
            </div>
          </div>

          <div className="mobile-order-details-info">
            <div className="mobile-order-details-info-item">
              <Calendar size={20} />
              <div>
                <p className="mobile-order-details-label">Order Date</p>
                <p className="mobile-order-details-value">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="mobile-order-details-info-item">
              <MapPin size={20} />
              <div>
                <p className="mobile-order-details-label">Billing Address</p>
                <p className="mobile-order-details-value">{order.billing_address}</p>
              </div>
            </div>

            <div className="mobile-order-details-info-item">
              <Package size={20} />
              <div>
                <p className="mobile-order-details-label">Total Amount</p>
                <p className="mobile-order-details-value mobile-order-details-amount">
                  ${parseFloat(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {order.reason_for_decline && (
            <div className="mobile-order-details-decline">
              <p className="mobile-order-details-decline-label">Reason for Decline:</p>
              <p className="mobile-order-details-decline-text">{order.reason_for_decline}</p>
            </div>
          )}

          {order.items && order.items.length > 0 && (
            <div className="mobile-order-details-items">
              <h3>Order Items</h3>
              {order.items.map((item, index) => (
                <div key={index} className="mobile-order-details-item">
                  <div className="mobile-order-details-item-image">
                    <img src={item.item_image || '/placeholder.png'} alt={item.item_name} />
                  </div>
                  <div className="mobile-order-details-item-info">
                    <h4>{item.item_name}</h4>
                    <p className="mobile-order-details-item-price">${parseFloat(item.price).toFixed(2)}</p>
                    <p className="mobile-order-details-item-qty">Quantity: {item.quantity}</p>
                  </div>
                  <div className="mobile-order-details-item-subtotal">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileStoreFooter />
    </div>
  );
}
