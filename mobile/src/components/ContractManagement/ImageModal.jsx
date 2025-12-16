import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

// Shadcn Components
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

  const handleDialogChange = (open) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700/30 z-[300]"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-b border-gray-700/30">
            <div>
              <DialogTitle className="font-semibold text-white text-base sm:text-lg mb-0">
                {getPersonName()}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-400 capitalize mt-1">
                {type === 'customer' ? 'Customer ID Card' : 'Sponsor ID Card'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="text-white hover:bg-gray-700/50 border-gray-700/30"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-white hover:bg-gray-700/50 border-gray-700/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-700/30" />

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-b border-gray-700/30 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 1}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm text-gray-300 min-w-[50px] sm:min-w-[60px] text-center font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-gray-700/30" />

            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm"
            >
              <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <Separator orientation="vertical" className="h-6 bg-gray-700/30" />

            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm"
            >
              Rotate
            </Button>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50"
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
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                draggable="false"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-t border-gray-700/30">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-400">
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