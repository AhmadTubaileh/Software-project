import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StoreApi from "../../services/storeApi";
import RecommendationApi from "../../services/recommendationApi";
import { useLocalSession } from "../../hooks/useLocalSession";
import toast from "react-hot-toast";


export default function Items() {
    const [storeProducts, setStoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recommendationType, setRecommendationType] = useState('loading');
    const { currentUser } = useLocalSession();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                
                const selectedBranchId = localStorage.getItem('selectedBranchId');
                
                if (!selectedBranchId) {
                    setError("Please select a branch first.");
                    setLoading(false);
                    return;
                }
                
                if (currentUser && currentUser.id) {
                    console.log(`✅ Logged-in user detected, fetching personalized recommendations for branch ${selectedBranchId}...`);
                    const personalizedItems = await RecommendationApi.getPersonalizedRecommendations(currentUser.id, 12, selectedBranchId);
                    setStoreProducts(personalizedItems);
                    setRecommendationType('personalized');
                } else {
                    console.log(`ℹ️ Anonymous user, fetching popular items for branch ${selectedBranchId}...`);
                    const popularItems = await RecommendationApi.getPopularItems(12, selectedBranchId);
                    setStoreProducts(popularItems);
                    setRecommendationType('popular');
                }
                
                setError(null);
            } catch (err) {
                console.error("Error fetching recommendations:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [currentUser]);

    async function addToCart(product, quantity = 1) {
        if (!currentUser || !currentUser.id) {
            toast.error('Please login to add items to cart');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    itemId: product.id,
                    quantity: quantity,
                    paymentPreference: 'cash'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${product.name} added to cart!`);
            } else {
                toast.error(data.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Error adding item to cart');
        }
    }

    if (loading) {
        return <div style={{ color: "white", padding: "20px", textAlign: "center" }}>Loading products...</div>;
    }

    if (error) {
        return <div style={{ color: "red", padding: "20px", textAlign: "center" }}>{error}</div>;
    }

    // Filter products based on search query
    const filteredProducts = storeProducts.filter(product => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const name = product.name.toLowerCase();
        return name.includes(query);
    });

    if (storeProducts.length === 0) {
        return <div style={{ color: "white", padding: "20px", textAlign: "center" }}>No products available.</div>;
    }

    if (filteredProducts.length === 0 && searchQuery) {
        return (
            <div style={{ color: "white", padding: "20px", textAlign: "center" }}>
                No products found matching "{searchQuery}"
            </div>
        );
    }

    return (
        <div>
            {searchQuery && (
                <div style={{ padding: "20px 40px", color: "white" }}>
                    <p style={{ fontSize: "16px" }}>
                        Showing {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                </div>
            )}
            <div className="items-grid">
            {filteredProducts.map((product) => (
                <div key={product.id} className="item-card">
                <Link to={`/store/product/${product.id}`}>
                    <img src={product.img} className="item-image" alt={product.name} />
                </Link>

                <h3 className="item-title">{product.name}</h3>
                <p className="item-price">${product.price}</p>

                <button className="item-btn" onClick={()=>addToCart(product,1)}>Add to Cart</button>
                </div>
            ))}
            </div>
        </div>
  );
}
