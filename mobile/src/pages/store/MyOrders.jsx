import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) {
      toast.error('Please login to view your orders');
      navigate('/');
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
        toast.error(data.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <MobileStoreHeader />
      
      <div className="mobile-orders-page">
        <div className="mobile-orders-header">
          <button className="mobile-back-btn" onClick={() => navigate('/store')}>
            <ArrowLeft size={24} />
          </button>
          <h1>My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="mobile-empty-state">
            <Package size={64} />
            <p>You haven't placed any orders yet</p>
            <button onClick={() => navigate('/store')} className="mobile-btn-primary">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="mobile-orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className="mobile-order-card"
                onClick={() => navigate(`/store/order/${order.id}`)}
              >
                <div className="mobile-order-card-header">
                  <div>
                    <p className="mobile-order-id">Order #{order.id}</p>
                    <p className="mobile-order-date">{formatDate(order.created_at)}</p>
                  </div>
                  <div 
                    className="mobile-order-status"
                    style={{ 
                      backgroundColor: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status)
                    }}
                  >
                    {order.status}
                  </div>
                </div>

                <div className="mobile-order-card-body">
                  <div className="mobile-order-info-row">
                    <span className="mobile-order-label">Total Amount:</span>
                    <span className="mobile-order-value">${parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  
                  {order.billing_address && (
                    <div className="mobile-order-info-row">
                      <span className="mobile-order-label">Address:</span>
                      <span className="mobile-order-value">{order.billing_address}</span>
                    </div>
                  )}

                  {order.reason_for_decline && (
                    <div className="mobile-order-decline-reason">
                      <p className="mobile-order-decline-label">Reason for Decline:</p>
                      <p className="mobile-order-decline-text">{order.reason_for_decline}</p>
                    </div>
                  )}
                </div>

                <div className="mobile-order-card-footer">
                  <span>View Details</span>
                  <ChevronRight size={20} />
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
