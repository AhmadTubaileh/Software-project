import React from 'react';
import MobileModal from '../MobileModal.jsx';
import '../../styles/theme.css';

const ApproveModal = ({ contract, processing, onClose, onApprove }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Approve Contract"
      size="medium"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
            Approve Contract
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Are you sure you want to approve this contract?
          </p>
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(55, 65, 81, 0.5)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '14px'
        }}>
          <div className="flex justify-between">
            <span style={{ color: '#9ca3af' }}>Customer:</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>{contract.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#9ca3af' }}>Item:</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>{contract.item_name}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#9ca3af' }}>Total:</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>{formatCurrency(contract.total_price)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#9ca3af' }}>Duration:</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>{contract.months} months</span>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{ fontSize: '12px', color: '#93c5fd', lineHeight: '1.5' }}>
            ✓ Contract will be activated<br />
            ✓ Payment schedule will be created<br />
            ✓ Item quantity remains reserved
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={processing}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="btn-success flex-1"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              'Approve Contract'
            )}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default ApproveModal;
