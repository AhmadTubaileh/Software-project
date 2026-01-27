import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StoreApi from "../../services/storeApi";
import RecommendationApi from "../../services/recommendationApi";
import { useLocalSession } from "../../hooks/useLocalSession";
import toast from "react-hot-toast";

export default function Items() {
    const [storeProducts, setStoreProducts] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useLocalSession();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [lastViewedCategory, setLastViewedCategory] = useState(null);

    useEffect(() => {
        async function fetchAllProducts() {
            try {
                setLoading(true);
                
                const selectedBranchId = localStorage.getItem('selectedBranchId');
                
                if (!selectedBranchId) {
                    setError("Please select a branch first.");
                    setLoading(false);
                    return;
                }
                
                // Fetch ALL products for this branch
                console.log(`📦 Fetching ALL products for branch ${selectedBranchId}...`);
                const allProducts = await StoreApi.getItems(selectedBranchId);
                setStoreProducts(allProducts);
                console.log(`✅ Found ${allProducts.length} products`);
                
                // Fetch personalized recommendations for logged-in users
                if (currentUser && currentUser.id) {
                    console.log(`⭐ Fetching recommendations for user ${currentUser.id}...`);
                    try {
                        const personalizedItems = await RecommendationApi.getPersonalizedRecommendations(
                            currentUser.id, 
                            12, 
                            selectedBranchId
                        );
                        setRecommendedProducts(personalizedItems);
                        setShowRecommendations(true);
                        console.log(`✅ Found ${personalizedItems.length} recommended products`);
                    } catch (recError) {
                        console.log("Could not fetch recommendations:", recError);
                    }
                }
                
                // Fetch similar products if last viewed item exists
                const lastViewedItem = JSON.parse(localStorage.getItem('lastViewedItem'));
                if (lastViewedItem) {
                    try {
                        const similarItems = await RecommendationApi.getSimilarItems(
                            lastViewedItem.id, 
                            6, 
                            selectedBranchId
                        );
                        setSimilarProducts(similarItems);
                        setLastViewedCategory(lastViewedItem.category || 'Products');
                    } catch (similarError) {
                        console.log("Could not fetch similar items:", similarError);
                    }
                }
                
                setError(null);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchAllProducts();
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

    if (filteredProducts.length === 0) {
        return (
            <div style={{ color: "white", padding: "20px", textAlign: "center" }}>
                {searchQuery ? `No products found matching "${searchQuery}"` : 'No products available.'}
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
            
            {/* Show Similar Products Section (with transparent background) */}
            {similarProducts.length > 0 && !searchQuery && (
                <div style={{ 
                    marginBottom: "40px",
                    background: "transparent",
                    borderRadius: "10px",
                    padding: "20px",
                    border: "1px solid rgba(255,255,255,0.1)"
                }}>
                    <h2 style={{ 
                        color: "white", 
                        padding: "0 0 20px 0", 
                        fontSize: "24px",
                        textAlign: "center"
                    }}>
                        🔍 Similar {lastViewedCategory} Products
                    </h2>
                    <div className="items-grid">
                        {similarProducts.map((product) => (
                            <div key={`similar-${product.id}`} className="item-card">
                                <Link to={`/store/product/${product.id}`}>
                                    <img src={product.img} className="item-image" alt={product.name} />
                                </Link>
                                <h3 className="item-title">{product.name}</h3>
                                <p className="item-price">${product.price}</p>
                                <button className="item-btn" onClick={()=>addToCart(product,1)}>
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Show Recommendations Section for logged-in users */}
            {showRecommendations && !searchQuery && recommendedProducts.length > 0 && (
                <div style={{ marginBottom: "40px" }}>
                    <h2 style={{ color: "white", padding: "0 40px 20px", fontSize: "24px" }}>
                        Recommended For You
                    </h2>
                    <div className="items-grid">
                        {recommendedProducts.map((product) => (
                            <div key={`rec-${product.id}`} className="item-card">
                                <Link to={`/store/product/${product.id}`}>
                                    <img src={product.img} className="item-image" alt={product.name} />
                                </Link>
                                <h3 className="item-title">{product.name}</h3>
                                <p className="item-price">${product.price}</p>
                                <button className="item-btn" onClick={()=>addToCart(product,1)}>
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Show ALL Products (or filtered products when searching) */}
            <div>
                {!searchQuery && (
                    <h2 style={{ color: "white", padding: "0 40px 20px", fontSize: "24px" }}>
                        {showRecommendations ? "All Products" : "Our Products"}
                    </h2>
                )}
                <div className="items-grid">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="item-card">
                            <Link to={`/store/product/${product.id}`}>
                                <img src={product.img} className="item-image" alt={product.name} />
                            </Link>
                            <h3 className="item-title">{product.name}</h3>
                            <p className="item-price">${product.price}</p>
                            <button className="item-btn" onClick={()=>addToCart(product,1)}>
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}