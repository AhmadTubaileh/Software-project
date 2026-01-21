import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/store/Header';
import Footer from '../components/store/Footer';
import { useLocalSession } from '../hooks/useLocalSession';
import toast from 'react-hot-toast';
import '../styles/store.css';

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
      console.log('🔍 Fetching installments for user:', currentUser.id);
      console.log('Request URL:', `http://localhost:5000/api/contracts/my-installments?userId=${currentUser.id}`);
      
      const response = await fetch(`http://localhost:5000/api/contracts/my-installments?userId=${currentUser.id}`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response error data:', errorData);
        throw new Error(errorData.error || 'Failed to fetch installments');
      }

      const data = await response.json();
      console.log('✅ Received data:', data);
      console.log('Number of contracts:', data.contracts?.length || 0);
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('❌ Error fetching installments:', error);
      console.error('Error details:', error.message);
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
        return 'rgb(16, 185, 129)'; // green
      case 'pending':
        return 'rgb(255, 178, 0)'; // yellow
      case 'completed':
        return 'rgb(59, 130, 246)'; // blue
      case 'rejected':
        return 'rgb(239, 68, 68)'; // red
      default:
        return 'rgb(156, 163, 175)'; // gray
    }
  };

  const calculateMonthsRemaining = (contract) => {
    if (contract.status !== 'active') return 0;
    
    const totalPayments = contract.total_payments || 0;
    const paidPayments = contract.paid_payments || 0;
    const months = contract.months || 0;
    
    // Total months includes down payment (month 0) + installment months
    const totalMonths = months + 1;
    return Math.max(0, totalMonths - paidPayments);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ color: 'white', padding: '40px', textAlign: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: '1.2rem' }}>Loading your installments...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ 
        maxWidth: '1200px', 
        margin: '30px auto', 
        padding: '20px',
        minHeight: '60vh'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '2rem', 
          marginBottom: '30px',
          borderBottom: '2px solid rgb(181,62,32)',
          paddingBottom: '10px'
        }}>
          My Installments
        </h1>

        {contracts.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No Installments Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              You don't have any installment contracts yet. Browse our products and apply for installments!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {contracts.map((contract) => (
              <div
                key={contract.id}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(181,62,32,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header Row */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ 
                      color: 'white', 
                      fontSize: '1.5rem', 
                      margin: '0 0 8px 0' 
                    }}>
                      {contract.item_name || 'Unknown Item'}
                    </h2>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      margin: 0,
                      fontSize: '0.9rem'
                    }}>
                      Contract #{contract.id} • Created {formatDate(contract.created_at)}
                    </p>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: getStatusColor(contract.status) + '20',
                    border: `1px solid ${getStatusColor(contract.status)}`,
                    color: getStatusColor(contract.status),
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem'
                  }}>
                    {contract.status}
                  </div>
                </div>

                {/* Rejection Reason */}
                {contract.status === 'rejected' && contract.rejection_reason && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      color: 'rgb(239, 68, 68)', 
                      fontWeight: 'bold',
                      marginBottom: '5px',
                      fontSize: '0.9rem'
                    }}>
                      ⚠️ Rejection Reason:
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.9rem'
                    }}>
                      {contract.rejection_reason}
                    </div>
                    {contract.decision_date && (
                      <div style={{ 
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.8rem',
                        marginTop: '5px'
                      }}>
                        Decision Date: {formatDate(contract.decision_date)}
                      </div>
                    )}
                  </div>
                )}

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.85rem',
                      marginBottom: '5px'
                    }}>
                      Total Price
                    </div>
                    <div style={{ 
                      color: 'rgb(255,178,0)', 
                      fontSize: '1.3rem',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(contract.total_price)}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.85rem',
                      marginBottom: '5px'
                    }}>
                      Down Payment
                    </div>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(contract.down_payment)}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.85rem',
                      marginBottom: '5px'
                    }}>
                      Monthly Payment
                    </div>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(contract.monthly_payment)}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.85rem',
                      marginBottom: '5px'
                    }}>
                      💰 Total Paid
                    </div>
                    <div style={{ 
                      color: 'rgb(16, 185, 129)', 
                      fontSize: '1.3rem',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(contract.total_amount_paid || 0)}
                    </div>
                  </div>

                  {contract.status === 'active' && (
                    <>
                      <div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: '0.85rem',
                          marginBottom: '5px'
                        }}>
                          Months Remaining
                        </div>
                        <div style={{ 
                          color: 'rgb(16, 185, 129)', 
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}>
                          {calculateMonthsRemaining(contract)} / {contract.months || 0}
                        </div>
                      </div>

                      <div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: '0.85rem',
                          marginBottom: '5px'
                        }}>
                          Amount Remaining
                        </div>
                        <div style={{ 
                          color: 'rgb(255,178,0)', 
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(contract.remaining_amount || 0)}
                        </div>
                      </div>

                      <div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: '0.85rem',
                          marginBottom: '5px'
                        }}>
                          Payments Status
                        </div>
                        <div style={{ 
                          color: 'white', 
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}>
                          {contract.paid_payments || 0} / {contract.total_payments || 0} Paid
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional Info */}
                {contract.status === 'active' && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '15px'
                  }}>
                    <div style={{ 
                      color: 'rgb(16, 185, 129)', 
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginBottom: '5px'
                    }}>
                      📅 Payment Schedule
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.85rem'
                    }}>
                      {contract.pending_payments || 0} payment(s) pending • 
                      Start Date: {formatDate(contract.start_date)}
                    </div>
                  </div>
                )}

                {/* Branch Info */}
                {contract.branch_name && (
                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem'
                  }}>
                    Branch: {contract.branch_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
