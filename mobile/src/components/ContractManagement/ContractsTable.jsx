import React from 'react';
import '../../styles/theme.css';

const ContractsTable = ({ contracts, loading, onViewDetails, onApprove, onReject, showActions = true, canApproveReject = false, canApproveRejectContract = null, getImageSrc }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusConfig = {
    pending: { label: 'Pending Review', color: 'status-pending', emoji: '⏳' },
    active: { label: 'Active', color: 'status-active', emoji: '✅' },
    rejected: { label: 'Rejected', color: 'status-rejected', emoji: '❌' },
    completed: { label: 'Completed', color: 'status-completed', emoji: '✓' },
    deleted: { label: 'Deleted', color: 'status-deleted', emoji: '🗑️' },
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.color}`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div 
        className="rounded-xl p-8 border text-center"
        style={{
          background: 'rgba(31, 41, 55, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-3 text-gray-400" style={{ fontSize: '14px' }}>Loading contracts...</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="contract-card text-center" style={{ padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📝</div>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>No contracts found</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {contracts.map((contract) => {
        const customerImageSrc = getImageSrc ? getImageSrc(contract.customer_id_card_image) : null;
        const isReapplication = contract.original_contract_info ? true : false;
        const hasReplacement = contract.replacement_contract_info ? true : false;

        return (
          <div 
            key={contract.id} 
            className="contract-card"
            style={{ padding: '16px' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {contract.item_name || 'Unknown Item'}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <span>#{contract.id}</span>
                  {contract.branch_name && (
                    <>
                      <span>•</span>
                      <span style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px'
                      }}>
                        {contract.branch_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {getStatusBadge(contract.status)}
            </div>

            {/* Relationship Info */}
            {(isReapplication || hasReplacement) && (
              <div className="flex items-center gap-2 mb-3">
                {isReapplication && (
                  <span className="status-badge" style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}>
                    🔄 Reapplication
                  </span>
                )}
                {hasReplacement && (
                  <span className="status-badge" style={{
                    background: 'rgba(107, 114, 128, 0.15)',
                    color: '#d1d5db',
                    borderColor: 'rgba(107, 114, 128, 0.3)',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}>
                    🔁 Replacement
                  </span>
                )}
              </div>
            )}

            {/* Customer Section */}
            <div style={{ marginBottom: '12px' }}>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>
                <span>👤</span>
                <span>Customer</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                {contract.customer_name || 'Unknown Customer'}
              </p>
              <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '12px', color: '#9ca3af' }}>
                <div className="flex items-center gap-1">
                  <span>📞</span>
                  <span>{contract.customer_phone || 'N/A'}</span>
                </div>
                <span>•</span>
                <span>Worker: {contract.worker_name || 'Unknown'}</span>
              </div>
            </div>

            {/* Financial Section */}
            <div className="grid grid-cols-2 gap-2 mb-3" style={{ fontSize: '12px' }}>
              <div>
                <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Total Price</p>
                <p style={{ fontWeight: '600', color: '#ffffff' }}>{formatCurrency(contract.total_price || 0)}</p>
              </div>
              <div>
                <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Down Payment</p>
                <p style={{ fontWeight: '600', color: '#ffffff' }}>{formatCurrency(contract.down_payment || 0)}</p>
              </div>
              <div>
                <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Monthly</p>
                <p style={{ fontWeight: '600', color: '#ffffff' }}>{formatCurrency(contract.monthly_payment || 0)}</p>
              </div>
              <div>
                <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Duration</p>
                <p style={{ fontWeight: '600', color: '#ffffff' }}>{contract.months || 0} months</p>
              </div>
            </div>

            {/* Payment Progress */}
            {contract.total_payments > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div className="flex justify-between mb-1" style={{ fontSize: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>Payment Progress</span>
                  <span style={{ fontWeight: '600', color: '#ffffff' }}>
                    {contract.paid_payments || 0}/{contract.total_payments}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(55, 65, 81, 0.4)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    width: `${((contract.paid_payments || 0) / contract.total_payments) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
              <button
                onClick={() => onViewDetails(contract)}
                className="btn-primary w-full"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>👁️</span>
                <span>View Details</span>
              </button>

              {showActions && contract.status === 'pending' && canApproveReject && canApproveRejectContract && canApproveRejectContract(contract) && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onApprove(contract)}
                    className="btn-success"
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <span>✓</span>
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => onReject(contract)}
                    className="btn-destructive"
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <span>✕</span>
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ 
              borderColor: 'rgba(75, 85, 99, 0.3)',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>📅</span>
              <span>Created: {formatDate(contract.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContractsTable;
