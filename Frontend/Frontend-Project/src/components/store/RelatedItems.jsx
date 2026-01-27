import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RecommendationApi from "../../services/recommendationApi";

export default function RelatedItems({ currentItemId }) {
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedItems() {
      if (!currentItemId) return;

      try {
        setLoading(true);
        const selectedBranchId = localStorage.getItem('selectedBranchId');
        const items = await RecommendationApi.getSimilarItems(currentItemId, 6, selectedBranchId);
        setRelatedItems(items);
      } catch (error) {
        console.error("Error fetching related items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedItems();
  }, [currentItemId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "white" }}>
        Loading related items...
      </div>
    );
  }

  if (relatedItems.length === 0) {
    return null;
  }

  return (
    <div className="similar-section" style={{ padding: "40px" }}>
      <h2 style={{ color: "white", marginBottom: "20px", fontSize: "24px" }}>
        🔍 Similar Products
      </h2>
      <p style={{ color: "#aaa", marginBottom: "30px", fontSize: "14px" }}>
        Other customers also viewed these items
      </p>
      
      <div className="items-grid" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
        gap: "20px" 
      }}>
        {relatedItems.map((item) => (
          <div key={item.id} className="item-card">
            <Link to={`/store/product/${item.id}`}>
              <img 
                src={item.img} 
                className="item-image" 
                alt={item.name}
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
            </Link>
            <h3 className="item-title" style={{ 
              color: "white", 
              fontSize: "16px", 
              margin: "10px 0" 
            }}>
              {item.name}
            </h3>
            <p className="item-price" style={{ 
              color: "#4CAF50", 
              fontSize: "18px", 
              fontWeight: "bold" 
            }}>
              ${item.price}
            </p>
            <Link to={`/store/product/${item.id}`}>
              <button className="item-btn" style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}>
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
