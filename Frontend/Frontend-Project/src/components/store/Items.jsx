import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cartProducts } from "../../data/cartProducts";
import StoreApi from "../../services/storeApi";
import RecommendationApi from "../../services/recommendationApi";
import { useLocalSession } from "../../hooks/useLocalSession";


export default function Items() {
    const [storeProducts, setStoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recommendationType, setRecommendationType] = useState('loading');
    const { currentUser } = useLocalSession();

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

    function addToCart(product,quantity=1){
        const existingIndex = cartProducts.findIndex((item)=>item.id===product.id);
        

        if(existingIndex!==-1){
            const item = cartProducts[existingIndex]

            item.quantity+=quantity;
            item.subtotal = item.price*item.quantity;
            cartProducts[existingIndex]  = item

        } else {
            cartProducts.push({
                  id: product.id,
                  img: product.img,
                  name: product.name,
                  price: product.price,
                  quantity: quantity,
                  subtotal: product.price * quantity
                });
                console.log("Added to cart:", product.name);
                alert(`${product.name} added to cart!`);
              }
    }

    if (loading) {
        return <div style={{ color: "white", padding: "20px", textAlign: "center" }}>Loading products...</div>;
    }

    if (error) {
        return <div style={{ color: "red", padding: "20px", textAlign: "center" }}>{error}</div>;
    }

    if (storeProducts.length === 0) {
        return <div style={{ color: "white", padding: "20px", textAlign: "center" }}>No products available.</div>;
    }

    return (
        <div>
            {/*
            <div style={{ padding: "20px 40px", color: "white" }}>
                <h2 style={{ marginBottom: "10px" }}>
                    {recommendationType === 'personalized' ? '🎯 Recommended For You' : '🔥 Popular Items'}
                </h2>
                <p style={{ fontSize: "14px", opacity: 0.8 }}>
                    {recommendationType === 'personalized' 
                        ? 'Based on your browsing and purchase history' 
                        : 'Trending products loved by our customers'}
                </p>
            </div>
            */}
            <div className="items-grid">
            {storeProducts.map((product) => (
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
