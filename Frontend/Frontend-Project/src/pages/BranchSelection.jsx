import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/branchSelection.css';

const API_BASE = 'http://localhost:5000/api/store';

export default function BranchSelection() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
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

        fetchBranches();
    }, []);

    const handleBranchSelect = (branchId) => {
        // Store selected branch in localStorage
        localStorage.setItem('selectedBranchId', branchId.toString());
        // Navigate to store home
        navigate('/store');
    };

    if (loading) {
        return (
            <div className="branch-selection-container">
                <div className="branch-selection-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading branches...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="branch-selection-container">
                <div className="branch-selection-error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="branch-selection-container">
            <div className="branch-selection-header">
                <h1>Welcome to MARS Store</h1>
                <p>Please select a branch to continue shopping</p>
            </div>
            
            <div className="branches-grid">
                {branches.map((branch) => (
                    <div 
                        key={branch.id} 
                        className="branch-card"
                        onClick={() => handleBranchSelect(branch.id)}
                    >
                        {branch.branch_img && (
                            <div className="branch-image-container">
                                <img 
                                    src={branch.branch_img} 
                                    alt={branch.name}
                                    className="branch-image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <div className="branch-info">
                            <h2 className="branch-name">{branch.name}</h2>
                            {branch.address && (
                                <p className="branch-address">
                                    <span className="icon">📍</span>
                                    {branch.address}
                                </p>
                            )}
                            {branch.phone && (
                                <p className="branch-phone">
                                    <span className="icon">📞</span>
                                    {branch.phone}
                                </p>
                            )}
                        </div>
                        <button className="branch-select-btn">
                            Select Branch
                        </button>
                    </div>
                ))}
            </div>

            {branches.length === 0 && (
                <div className="no-branches">
                    <p>No branches available at the moment.</p>
                </div>
            )}
        </div>
    );
}
