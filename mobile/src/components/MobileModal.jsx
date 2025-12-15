import React from 'react';
import './MobileModal.css';

function MobileModal({ isOpen, onClose, title, children, size = 'medium' }) {
  if (!isOpen) return null;

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div 
        className={`mobile-modal-content mobile-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-modal-header">
          <h2 className="mobile-modal-title">{title}</h2>
          <button
            onClick={onClose}
            className="mobile-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mobile-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MobileModal;
