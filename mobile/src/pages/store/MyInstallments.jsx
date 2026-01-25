import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function MyInstallments() {
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      toast.error('Please login to view your installments');
      navigate('/');
      return;
    }
    fetchInstallments();
  }, [currentUser, navigate]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/contracts/my-installments?userId=${currentUser.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch installments');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast.error('Failed to load installments: ' + error.message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#FFB200';
      case 'completed':
        return '#3B82F6';
      case 'rejected':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const calculateMonthsRemaining = (contract) => {
    if (contract.status !== 'active') return 0;
    const totalMonths = (contract.months || 0) + 1;
    return Math.max(0, totalMonths - (contract.paid_payments || 0));
  };

  if (loading) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading installments...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <MobileStoreHeader />
      
      <div className="mobile-installments-page">
        <div className="mobile-installments-header">
          <button className="mobile-back-btn" onClick={() => navigate('/store')}>
            <ArrowLeft size={24} />
          </button>
          <h1>My Installments</h1>
        </div>

        {contracts.length === 0 ? (
          <div className="mobile-empty-state">
            <CreditCard size={64} />
            <p>No installment contracts found</p>
            <button onClick={() => navigate('/store')} className="mobile-btn-primary">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="mobile-installments-list">
            {contracts.map((contract) => (
              <div key={contract.id} className="mobile-installment-card">
                <div className="mobile-installment-header">
                  <div>
                    <h3>{contract.item_name || 'Unknown Item'}</h3>
                    <p className="mobile-installment-contract-id">
                      Contract #{contract.id}
                    </p>
                  </div>
                  <div 
                    className="mobile-installment-status"
                    style={{ 
                      backgroundColor: `${getStatusColor(contract.status)}20`,
                      color: getStatusColor(contract.status)
                    }}
                  >
                    {contract.status}
                  </div>
                </div>

                {contract.status === 'rejected' && contract.rejection_reason && (
                  <div className="mobile-installment-rejection">
                    <p className="mobile-installment-rejection-label">Rejection Reason:</p>
                    <p className="mobile-installment-rejection-text">{contract.rejection_reason}</p>
                  </div>
                )}

                <div className="mobile-installment-details">
                  <div className="mobile-installment-detail-row">
                    <span className="mobile-installment-label">Total Price:</span>
                    <span className="mobile-installment-value mobile-installment-highlight">
                      {formatCurrency(contract.total_price)}
                    </span>
                  </div>

                  <div className="mobile-installment-detail-row">
                    <span className="mobile-installment-label">Down Payment:</span>
                    <span className="mobile-installment-value">
                      {formatCurrency(contract.down_payment)}
                    </span>
                  </div>

                  <div className="mobile-installment-detail-row">
                    <span className="mobile-installment-label">Monthly Payment:</span>
                    <span className="mobile-installment-value">
                      {formatCurrency(contract.monthly_payment)}
                    </span>
                  </div>

                  <div className="mobile-installment-detail-row">
                    <span className="mobile-installment-label">Total Paid:</span>
                    <span className="mobile-installment-value mobile-installment-success">
                      {formatCurrency(contract.total_amount_paid || 0)}
                    </span>
                  </div>

                  {contract.status === 'active' && (
                    <>
                      <div className="mobile-installment-detail-row">
                        <span className="mobile-installment-label">Months Remaining:</span>
                        <span className="mobile-installment-value">
                          {calculateMonthsRemaining(contract)} / {contract.months || 0}
                        </span>
                      </div>

                      <div className="mobile-installment-detail-row">
                        <span className="mobile-installment-label">Amount Remaining:</span>
                        <span className="mobile-installment-value mobile-installment-warning">
                          {formatCurrency(contract.remaining_amount || 0)}
                        </span>
                      </div>

                      <div className="mobile-installment-detail-row">
                        <span className="mobile-installment-label">Payments Status:</span>
                        <span className="mobile-installment-value">
                          {contract.paid_payments || 0} / {contract.total_payments || 0} Paid
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mobile-installment-footer">
                  <p className="mobile-installment-date">
                    Created: {formatDate(contract.created_at)}
                  </p>
                  {contract.branch_name && (
                    <p className="mobile-installment-branch">
                      Branch: {contract.branch_name}
                    </p>
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
