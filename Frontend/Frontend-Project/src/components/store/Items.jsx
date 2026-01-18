import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cartProducts } from "../../data/cartProducts";
import StoreApi from "../../services/storeApi";


export default function Items() {
    const [storeProducts, setStoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                // Get selected branch from localStorage
                const selectedBranchId = localStorage.getItem('selectedBranchId');
                
                if (!selectedBranchId) {
                    setError("Please select a branch first.");
                    setLoading(false);
                    return;
                }
                
                const products = await StoreApi.getItems(selectedBranchId);
                setStoreProducts(products);
                setError(null);
            } catch (err) {
                console.error("Error fetching store products:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

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
  );
}
