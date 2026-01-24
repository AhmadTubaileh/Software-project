import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { cartProducts } from "../../data/cartProducts";
import Header from "./Header";
import Footer from "./Footer";

export default function CategoryPage() {
    const { slug } = useParams();
    const [items, setItems] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const fetchCategoryItems = useCallback(async () => {
        try {
            setLoading(true);
            
            const selectedBranchId = localStorage.getItem('selectedBranchId');
            
            if (!selectedBranchId) {
                setError("Please select a branch first.");
                setLoading(false);
                return;
            }
            
            const categoriesResponse = await fetch('http://localhost:5000/api/categories');
            const categoriesData = await categoriesResponse.json();
            
            if (!categoriesData.success) {
                throw new Error('Failed to fetch categories');
            }
            
            const category = categoriesData.categories.find(cat => cat.slug === slug);
            
            if (!category) {
                setError("Category not found");
                setLoading(false);
                return;
            }
            
            setCategoryName(category.name);
            
            const itemsResponse = await fetch(`http://localhost:5000/api/store/items?category_id=${category.id}&branch_id=${selectedBranchId}`);
            const itemsData = await itemsResponse.json();
            
            if (itemsData.success) {
                setItems(itemsData.items);
            } else {
                throw new Error(itemsData.message || 'Failed to fetch items');
            }
            
            setError(null);
        } catch (err) {
            console.error("Error fetching category items:", err);
            setError("Failed to load items. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchCategoryItems();
    }, [fetchCategoryItems]);

    function addToCart(product, quantity = 1) {
        const existingIndex = cartProducts.findIndex((item) => item.id === product.id);

        if (existingIndex !== -1) {
            const item = cartProducts[existingIndex];
            item.quantity += quantity;
            item.subtotal = item.price * item.quantity;
            cartProducts[existingIndex] = item;
        } else {
            cartProducts.push({
                id: product.id,
                img: product.img,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity
            });
        }
        console.log("Added to cart:", product.name);
        alert(`${product.name} added to cart!`);
    }

    // Filter items based on search query
    const filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const name = item.name.toLowerCase();
        return name.includes(query);
    });

    return (
        <>
            <Header />
            <div style={{ minHeight: "60vh", padding: "20px 40px" }}>
                <h1 style={{ color: "white", marginBottom: "20px" }}>
                    {categoryName || "Category"}
                </h1>

                {loading && (
                    <div style={{ color: "white", textAlign: "center" }}>
                        Loading items...
                    </div>
                )}

                {error && (
                    <div style={{ color: "red", textAlign: "center" }}>
                        {error}
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div style={{ color: "white", textAlign: "center" }}>
                        No items available in this category.
                    </div>
                )}

                {!loading && !error && items.length > 0 && filteredItems.length === 0 && searchQuery && (
                    <div style={{ color: "white", textAlign: "center" }}>
                        No items found matching "{searchQuery}" in {categoryName}
                    </div>
                )}

                {!loading && !error && filteredItems.length > 0 && (
                    <>
                        {searchQuery && (
                            <div style={{ marginBottom: "20px" }}>
                                <p style={{ color: "white", fontSize: "16px" }}>
                                    Showing {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}" in {categoryName}
                                </p>
                            </div>
                        )}
                        <div className="items-grid">
                            {filteredItems.map((product) => (
                            <div key={product.id} className="item-card">
                                <Link to={`/store/product/${product.id}`}>
                                    <img src={product.img} className="item-image" alt={product.name} />
                                </Link>

                                <h3 className="item-title">{product.name}</h3>
                                <p className="item-price">${product.price}</p>

                                <button className="item-btn" onClick={() => addToCart(product, 1)}>
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </>
    );
}
