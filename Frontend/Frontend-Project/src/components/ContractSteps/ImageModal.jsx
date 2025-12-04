import React, { useState, useRef } from 'react';

function ImageModal({ isOpen, imageSrc, customer, onClose, type = 'customer' }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetZoom();
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5)); // Max 5x zoom
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1)); // Min 1x zoom
    if (zoom - 0.5 <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'customer':
        return `Customer ID Card - ${customer.full_name}`;
      case 'sponsor':
        return `Sponsor ID Card - ${customer.full_name}`;
      default:
        return 'ID Card Image';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-2"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full h-full relative flex flex-col">
        {/* Header with Controls */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
            <p className="text-gray-400 text-sm">
              {zoom > 1 ? 'Click and drag to pan • ' : ''}
              Scroll to zoom • Click outside to close
            </p>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-3 mr-4">
            <button
              onClick={zoomOut}
              disabled={zoom <= 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded transition-colors duration-200"
            >
              🔍-
            </button>
            <span className="text-white text-sm font-mono bg-gray-700 px-2 py-1 rounded">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 5}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded transition-colors duration-200"
            >
              🔍+
            </button>
            <button
              onClick={resetZoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors duration-200"
            >
              Reset
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              onClose();
              resetZoom();
            }}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Image Container */}
        <div 
          className="flex-1 p-4 flex justify-center items-center overflow-hidden relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {imageSrc ? (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <img
                ref={imageRef}
                src={imageSrc}
                alt={`ID Card of ${customer.full_name}`}
                className={`max-w-none transition-transform duration-200 ${
                  isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
                }`}
                style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                onMouseDown={handleMouseDown}
                draggable="false"
              />
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg">No image available</p>
            </div>
          )}

          {/* Zoom Level Indicator */}
          {zoom > 1 && imageSrc && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
              Zoom: {zoom.toFixed(1)}x
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-gray-700 bg-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Name:</span>
              <p className="text-white font-medium truncate">{customer.full_name}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>
              <p className="text-white">{customer.phone}</p>
            </div>
            <div>
              <span className="text-gray-400">ID Card:</span>
              <p className="text-white font-mono">{customer.id_card_number}</p>
            </div>
            {customer.email && (
              <div>
                <span className="text-gray-400">Email:</span>
                <p className="text-white truncate">{customer.email}</p>
              </div>
            )}
            {customer.relationship && (
              <div>
                <span className="text-gray-400">Relationship:</span>
                <p className="text-white">{customer.relationship}</p>
              </div>
            )}
            {customer.address && (
              <div className="md:col-span-2">
                <span className="text-gray-400">Address:</span>
                <p className="text-white truncate">{customer.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageModal;