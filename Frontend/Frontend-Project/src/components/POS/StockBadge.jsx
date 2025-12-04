import React from 'react';

const StockBadge = ({ product }) => {
  const getStockBadge = (item) => {
    if (item.available !== 1) {
      return { text: 'Unavailable', class: 'bg-red-600' };
    }
    if (item.quantity <= 0) {
      return { text: 'Out of stock', class: 'bg-red-600' };
    }
    if (item.quantity <= 5) {
      return { text: `Low stock (${item.quantity})`, class: 'bg-yellow-600' };
    }
    return { text: `${item.quantity} in stock`, class: 'bg-green-600' };
  };

  const stockBadge = getStockBadge(product);

  return (
    <div className={`px-2 py-1 rounded text-xs font-semibold ${stockBadge.class}`}>
      {stockBadge.text}
    </div>
  );
};

export default StockBadge;