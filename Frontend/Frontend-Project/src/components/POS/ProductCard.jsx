// components/POS/ProductCard.jsx
import React from 'react';
import StockBadge from './StockBadge.jsx';
import PriceEditor from './PriceEditor.jsx';

const ProductCard = ({ 
  product, 
  cart, 
  editingItem, 
  currentUser, 
  onAddToCart, 
  onStartEditPrice, 
  onSavePrice, 
  onCancelEditPrice, 
  priceEdit, 
  setPriceEdit, 
  isItemAvailable,
  getDisplayPrice
}) => {
  const available = isItemAvailable(product);
  const isEditing = editingItem?.id === product.id;
  const inCart = cart.find(item => item.id === product.id);
  const hasCustomPriceInCart = inCart && inCart.price_cash !== inCart.original_price;
  
  // Safely get display price and ensure it's a number
  const displayPrice = getDisplayPrice ? getDisplayPrice(product) : (product.price_cash || 0);
  const safeDisplayPrice = typeof displayPrice === 'number' ? displayPrice : parseFloat(displayPrice) || 0;
  
  // Safely get product price_cash
  const productPriceCash = parseFloat(product.price_cash) || 0;
  
  // Safely get on_sale_price
  const onSalePriceNum = product.on_sale_price ? parseFloat(product.on_sale_price) : null;
  
  // Check if item is on sale - THIS IS THE KEY FIX
  const isOnSale = onSalePriceNum !== null && 
                   onSalePriceNum > 0 && 
                   onSalePriceNum < productPriceCash;

  // Debug: Log sale status
  console.log('ProductCard Sale Status:', {
    name: product.name,
    price_cash: productPriceCash,
    on_sale_price: onSalePriceNum,
    displayPrice: safeDisplayPrice,
    isOnSale: isOnSale,
    condition: `onSalePriceNum (${onSalePriceNum}) < productPriceCash (${productPriceCash}) = ${onSalePriceNum !== null && onSalePriceNum > 0 && onSalePriceNum < productPriceCash}`
  });

  // Calculate discount percentage
  const discountPercent = isOnSale 
    ? Math.round(((productPriceCash - onSalePriceNum) / productPriceCash) * 100)
    : 0;

  // Function to get emoji icon for each category
  const getCategoryIcon = (item) => {
    if (!item.name) return '🔌';
    const name = item.name.toLowerCase();
    if (name.includes('phone')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('headphone') || name.includes('earphone')) return '🎧';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('console') || name.includes('game')) return '🎮';
    if (name.includes('watch') || name.includes('smartwatch')) return '⌚';
    if (name.includes('camera')) return '📷';
    if (name.includes('tablet') || name.includes('ipad')) return '📱';
    if (name.includes('speaker') || name.includes('sound')) return '🔊';
    return '🔌';
  };

  // Safely format price
  const formatPrice = (price) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <div
      className={`relative p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 transition-all duration-300 transform hover:shadow-xl ${
        available 
          ? `border-gray-700 hover:border-blue-500 hover:scale-[1.02] ${isOnSale ? 'border-orange-500/50' : ''}` 
          : 'border-red-500/50 opacity-70'
      } ${isEditing ? 'ring-2 ring-yellow-500 border-yellow-500 shadow-lg' : ''} ${
        hasCustomPriceInCart ? 'border-green-500' : ''
      }`}
    >
      {/* SALE BADGE - This was missing! */}
      {isOnSale && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="relative">
            {/* Pulsing effect */}
            <div className="absolute animate-ping w-full h-full bg-orange-500 rounded-full opacity-75"></div>
            
            {/* Main sale badge */}
            <div className="relative px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg transform -rotate-3 flex items-center gap-1">
              <span className="text-sm">🔥</span>
              <span>SALE</span>
              <span className="ml-1 px-1 bg-white/20 rounded text-xs">{discountPercent}% OFF</span>
            </div>
            
            {/* Corner accent */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-700 transform rotate-45 rounded-sm"></div>
          </div>
        </div>
      )}

      {/* Custom Price Badge - Top Left */}
      {hasCustomPriceInCart && (
        <div className="absolute -top-2 -left-2 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg transform rotate-6">
          ✏️ EDITED
        </div>
      )}

      {/* Product Image or Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <div className={`text-4xl p-3 rounded-lg ${isOnSale ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
            {product.item_image ? (
              <img 
                src={`data:image/jpeg;base64,${product.item_image}`} 
                alt={product.name || 'Product'}
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
            ) : (
              <span className={isOnSale ? 'text-orange-400' : 'text-blue-400'}>
                {getCategoryIcon(product)}
              </span>
            )}
          </div>
        </div>
        <StockBadge product={product} />
      </div>

      <h3 className="font-semibold text-lg mb-1 truncate text-white">
        {product.name || 'Unnamed Product'}
      </h3>
      <p className="text-gray-400 text-sm mb-2 line-clamp-2 h-10">
        {product.description || 'No description available'}
      </p>
      
      {/* Price Section - UPDATED FOR SALE DISPLAY */}
      <div className="mb-3">
        {isEditing ? (
          <PriceEditor
            priceEdit={priceEdit}
            setPriceEdit={setPriceEdit}
            onSave={onSavePrice}
            onCancel={onCancelEditPrice}
            originalPrice={safeDisplayPrice}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                {/* ALWAYS SHOW SALE VISUALS WHEN ON SALE */}
                {isOnSale ? (
                  <div className="space-y-1">
                    {/* Sale Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-orange-400">
                        ${formatPrice(safeDisplayPrice)}
                      </span>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded">
                        Save ${formatPrice(productPriceCash - safeDisplayPrice)}
                      </span>
                    </div>
                    
                    {/* Original Price (Crossed out) */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through text-sm">
                        ${formatPrice(productPriceCash)}
                      </span>
                      <span className="text-orange-400 text-xs font-bold">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Regular Price (No sale) */
                  <div>
                    <p className="text-xl font-bold text-blue-400">
                      ${formatPrice(safeDisplayPrice)}
                    </p>
                  </div>
                )}
                
                {/* Custom Price Indicator */}
                {hasCustomPriceInCart && inCart && (
                  <p className="text-xs text-gray-400 line-through mt-1">
                    Original: ${formatPrice(inCart.original_price)}
                  </p>
                )}
              </div>
              
              {/* Edit Price Button (Admin only) */}
              {currentUser && currentUser.role === 'admin'|| currentUser.role === 'employee' && inCart && (
                <button
                  onClick={() => onStartEditPrice(product)}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium transition-colors duration-200"
                  title="Edit Sale Price"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            
            {/* Installment Info (for display only) */}
            {product.price_installment_total && (
              <p className="text-green-400 text-xs pt-1 border-t border-gray-700/50 mt-1">
                💳 Installment: ${formatPrice(product.price_installment_total)}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Add to Cart Button - UPDATED COLOR FOR SALE */}
      <button
        onClick={() => onAddToCart(product)}
        disabled={!available || isEditing}
        className={`w-full px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
          available && !isEditing
            ? `${isOnSale 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                : 'bg-blue-600 hover:bg-blue-700'} transform hover:scale-105`
            : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {available ? (
            <>
              <span>{isOnSale ? '🔥' : '🛒'}</span>
              <span>{isOnSale ? 'Add Sale Item' : 'Add to Cart'}</span>
            </>
          ) : (
            <>
              <span>⛔</span>
              <span>Out of Stock</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default ProductCard;