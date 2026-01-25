import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/MobileStore.css';

export default function MobileStoreNav() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <nav className="mobile-store-nav">
      <div className="mobile-store-nav-scroll">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            to={`/store/category/${category.slug}`} 
            className="mobile-store-nav-item"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
