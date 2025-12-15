import React, { useState, useRef } from 'react';
import MobileModal from '../MobileModal.jsx';
import '../../styles/theme.css';

function ImageModal({ isOpen, imageSrc, customer, onClose, type = 'customer' }) {
  const [imageZoom, setImageZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  if (!isOpen) return null;

  const resetZoom = () => {
    setImageZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setImageZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleTouchStart = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setStartPosition({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && imageZoom > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - startPosition.x,
        y: touch.clientY - startPosition.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getPersonName = () => {
    return customer?.full_name || 'Unknown';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ color: '#ffffff', fontWeight: '600', fontSize: '16px' }}>
          {getPersonName()}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={zoomOut}
            disabled={imageZoom <= 1}
            className="btn-outline"
            style={{
              padding: '8px',
              minWidth: 'auto',
              opacity: imageZoom <= 1 ? 0.5 : 1,
              cursor: imageZoom <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔍-</span>
          </button>
          <button
            onClick={resetZoom}
            className="btn-outline"
            style={{
              padding: '8px',
              minWidth: 'auto'
            }}
          >
            <span style={{ fontSize: '20px' }}>↻</span>
          </button>
          <button
            onClick={zoomIn}
            disabled={imageZoom >= 3}
            className="btn-outline"
            style={{
              padding: '8px',
              minWidth: 'auto',
              opacity: imageZoom >= 3 ? 0.5 : 1,
              cursor: imageZoom >= 3 ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔍+</span>
          </button>
          <button
            onClick={() => {
              resetZoom();
              onClose();
            }}
            className="btn-outline"
            style={{
              padding: '8px',
              minWidth: 'auto'
            }}
          >
            <span style={{ fontSize: '20px' }}>✕</span>
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {imageSrc ? (
          <img
            ref={imageRef}
            src={imageSrc}
            alt="ID Card"
            style={{
              maxWidth: '100%',
              transition: 'transform 0.3s',
              transform: `scale(${imageZoom})`,
              cursor: isDragging ? 'grabbing' : imageZoom > 1 ? 'grab' : 'default'
            }}
            draggable="false"
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <p style={{ fontSize: '18px' }}>No image available</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default ImageModal;

