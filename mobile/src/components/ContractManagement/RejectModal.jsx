import React from 'react';
import MobileModal from '../MobileModal.jsx';
import '../../styles/theme.css';

const RejectModal = ({ contract, processing, rejectionReason, onRejectionReasonChange, onClose, onReject }) => {
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
      title="Reject Contract"
      size="medium"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <span style={{ fontSize: '24px' }}>✕</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
            Reject Contract
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Please provide a reason for rejection
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
            <span style={{ fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
              {contract.item_name}
            </span>
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Rejection Reason *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            placeholder="Enter the reason for rejecting this contract..."
            rows={4}
            className="mobile-input w-full"
            style={{
              minHeight: '100px',
              resize: 'none',
              fontSize: '14px',
              padding: '12px'
            }}
          />
        </div>

        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <p style={{ fontSize: '12px', color: '#f87171', lineHeight: '1.5' }}>
            ! Item quantity will be increased by 1<br />
            ! Reservation will be released
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
            onClick={onReject}
            disabled={processing || !rejectionReason.trim()}
            className="btn-destructive flex-1"
            style={{
              opacity: processing || !rejectionReason.trim() ? 0.5 : 1,
              cursor: processing || !rejectionReason.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              'Reject Contract'
            )}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default RejectModal;
