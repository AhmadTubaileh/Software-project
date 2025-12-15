import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

// Shadcn Components
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const ImageModal = ({ isOpen, onClose, imageSrc, customer, type = 'customer' }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  if (!isOpen || !imageSrc) return null;

  const getPersonName = () => {
    return customer?.full_name || customer?.name || 'Unknown';
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 1);
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${getPersonName().replace(/\s+/g, '_')}_ID_Card.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/90 border-b border-gray-800">
            <div>
              <h3 className="font-semibold text-white">{getPersonName()}</h3>
              <p className="text-sm text-gray-400 capitalize">
                {type === 'customer' ? 'Customer ID Card' : 'Sponsor ID Card'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="text-white hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-4 bg-black/90 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 1}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-300 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-gray-700" />

            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="text-white border-gray-700 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Separator orientation="vertical" className="h-6 bg-gray-700" />

            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
              className="text-white border-gray-700 hover:bg-gray-800"
            >
              Rotate
            </Button>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              ref={imageRef}
              className="relative transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                ...(zoom > 1 && {
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`
                })
              }}
            >
              <img
                src={imageSrc}
                alt="ID Card"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                draggable="false"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/90 border-t border-gray-800">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {zoom > 1 ? 'Drag to pan image • ' : ''}
                Use controls to zoom and rotate
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;