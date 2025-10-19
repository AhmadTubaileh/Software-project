export function filterProducts(products, query, sortBy) {
  const q = (query || '').trim().toLowerCase();
  let list = !q
    ? products
    : products.filter(p =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
  if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}


