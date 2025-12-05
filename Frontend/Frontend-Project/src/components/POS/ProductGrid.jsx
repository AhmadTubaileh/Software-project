// components/POS/ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductGrid = ({ 
  loading, 
  filteredProducts, 
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
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-400 text-lg font-medium">Loading products...</p>
        <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4 text-gray-600">🔍</div>
        <h3 className="text-xl font-bold text-gray-300 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filter</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-custom">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1"> {/* Increased gap from 4 to 6 */}
        {filteredProducts.map(product => (
          <div key={product.id} className="transform transition-transform duration-300 hover:scale-[1.01]">
            <ProductCard
            key={product.id}
            product={product}
            cart={cart}
            editingItem={editingItem}
            currentUser={currentUser}
            onAddToCart={onAddToCart}
            onStartEditPrice={onStartEditPrice}
            onSavePrice={onSavePrice}
            onCancelEditPrice={onCancelEditPrice}
            priceEdit={priceEdit}
            setPriceEdit={setPriceEdit}
            isItemAvailable={isItemAvailable}
            getDisplayPrice={getDisplayPrice}
            
/>
          </div>
        ))}
      </div>
      
      {/* Products Count Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800/50">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {filteredProducts.length} of {filteredProducts.length} products</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Ready for checkout</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;