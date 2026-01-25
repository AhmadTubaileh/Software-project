import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ChevronRight } from 'lucide-react';
import '../../styles/MobileStore.css';

const API_BASE = 'http://localhost:5000/api/store';

export default function BranchSelection() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/branches`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch branches');
      }
      
      setBranches(data.branches || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleBranchSelect = (branchId) => {
    localStorage.setItem('selectedBranchId', branchId.toString());
    navigate('/store');
  };

  if (loading) {
    return (
      <div className="mobile-store-page">
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading branches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-store-page">
        <div className="mobile-store-error">
          <p>{error}</p>
          <button onClick={fetchBranches} className="mobile-btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <div className="mobile-store-header">
        <Store size={48} className="mobile-store-icon" />
        <h1>Welcome to MARS Store</h1>
        <p>Select a branch to start shopping</p>
      </div>
      
      <div className="mobile-branches-list">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className="mobile-branch-card"
            onClick={() => handleBranchSelect(branch.id)}
          >
            {branch.branch_img && (
              <div className="mobile-branch-image">
                <img 
                  src={branch.branch_img} 
                  alt={branch.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="mobile-branch-info">
              <h2>{branch.name}</h2>
              {branch.address && (
                <p className="mobile-branch-detail">
                  <MapPin size={16} />
                  <span>{branch.address}</span>
                </p>
              )}
              {branch.phone && (
                <p className="mobile-branch-detail">
                  <Phone size={16} />
                  <span>{branch.phone}</span>
                </p>
              )}
            </div>
            <ChevronRight size={24} className="mobile-branch-arrow" />
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="mobile-empty-state">
          <Store size={64} />
          <p>No branches available at the moment.</p>
        </div>
      )}
    </div>
  );
}
