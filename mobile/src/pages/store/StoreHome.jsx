import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreNav from '../../components/store/MobileStoreNav';
import MobileProductGrid from '../../components/store/MobileProductGrid';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import '../../styles/MobileStore.css';

export default function StoreHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    if (!selectedBranchId) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="mobile-store-container">
      <Toaster position="top-center" />
      <MobileStoreHeader />
      <MobileStoreNav />
      <MobileProductGrid />
      <MobileStoreFooter />
    </div>
  );
}
