import React from 'react';

function getCategoryIcon(category) {
  switch (category) {
    case 'phone': return '📱';
    case 'laptop': return '💻';
    case 'headphones': return '🎧';
    case 'tv': return '📺';
    case 'console': return '🎮';
    case 'watch': return '⌚';
    default: return '🔌';
  }
}

function ProductCard({ product, paymentPref, onSetPayment, onAddToCart }) {
  return (
    <article className="product-card transition-transform">
      <div className="product-icon" aria-hidden="true">{getCategoryIcon(product.category)}</div>
      <div className="product-body">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        <p className="product-price">${product.price}</p>

        <div className="payment-toggle" role="group" aria-label="Payment preference">
          <label className={paymentPref === 'cash' ? 'active' : ''}>
            <input type="radio" name={`pay-${product.id}`} checked={paymentPref === 'cash'} onChange={() => onSetPayment(product.id, 'cash')} />
            Cash
          </label>
          <label className={paymentPref === 'installment' ? 'active' : ''}>
            <input type="radio" name={`pay-${product.id}`} checked={paymentPref === 'installment'} onChange={() => onSetPayment(product.id, 'installment')} />
            Installment
          </label>
        </div>

        <button className="add-to-cart px-3 py-2 rounded-lg border border-brand bg-brand text-white shadow hover:brightness-105 transition" onClick={() => onAddToCart(product)}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default ProductCard;


