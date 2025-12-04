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
  isItemAvailable 
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
      {filteredProducts.map(product => (
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
        />
      ))}
    </div>
  );
};

export default ProductGrid;