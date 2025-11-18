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
  isItemAvailable 
}) => {
  const available = isItemAvailable(product);
  const isEditing = editingItem?.id === product.id;
  const inCart = cart.find(item => item.id === product.id);
  const hasCustomPriceInCart = inCart && inCart.price_cash !== inCart.original_price;

  // Function to get emoji icon for each category
  const getCategoryIcon = (item) => {
    const name = item.name.toLowerCase();
    if (name.includes('phone')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('headphone') || name.includes('earphone')) return '🎧';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('console') || name.includes('game')) return '🎮';
    if (name.includes('watch') || name.includes('smartwatch')) return '⌚';
    return '🔌';
  };

  return (
    <div
      className={`p-4 bg-gray-800 rounded-xl border-2 transition-all duration-200 transform ${
        available 
          ? 'border-gray-700 hover:border-blue-500 hover:scale-105' 
          : 'border-red-500 opacity-70'
      } ${isEditing ? 'ring-2 ring-yellow-500 border-yellow-500' : ''} ${
        hasCustomPriceInCart ? 'border-green-500' : ''
      }`}
    >
      {/* Product Image or Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-4xl">
          {product.item_image ? (
            <img 
              src={`data:image/jpeg;base64,${product.item_image}`} 
              alt={product.name}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            getCategoryIcon(product)
          )}
        </div>
        <StockBadge product={product} />
      </div>

      <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
      <p className="text-gray-400 text-sm mb-2 line-clamp-2 h-10">
        {product.description}
      </p>
      
      {/* Price Section */}
      <div className="mb-3">
        {isEditing ? (
          <PriceEditor
            priceEdit={priceEdit}
            setPriceEdit={setPriceEdit}
            onSave={onSavePrice}
            onCancel={onCancelEditPrice}
            originalPrice={product.price_cash}
          />
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-xl font-bold ${
                  hasCustomPriceInCart ? 'text-green-400' : 'text-blue-400'
                }`}>
                  ${inCart ? inCart.price_cash : product.price_cash}
                </p>
                {hasCustomPriceInCart && (
                  <p className="text-xs text-gray-400 line-through">
                    Original: ${product.price_cash}
                  </p>
                )}
              </div>
              {currentUser.role === 'admin' && inCart && (
                <button
                  onClick={() => onStartEditPrice(product)}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium transition-colors duration-200"
                  title="Edit Sale Price"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            {product.price_installment_total && (
              <p className="text-green-400 text-xs">
                Installment: ${product.price_installment_total}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Add to Cart Button */}
      <button
        onClick={() => onAddToCart(product)}
        disabled={!available || isEditing}
        className={`w-full px-4 py-2 rounded-lg transition-all duration-200 ${
          available && !isEditing
            ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
            : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {available ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};

export default ProductCard;