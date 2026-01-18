import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "../components/store/Header";
import Slider from "../components/store/Slider";
import Items from "../components/store/Items";
import Footer from "../components/store/Footer";

import "../styles/store.css";   

export default function StoreHome() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if branch is selected, if not redirect to branch selection
        const selectedBranchId = localStorage.getItem('selectedBranchId');
        if (!selectedBranchId) {
            navigate('/');
        }
    }, [navigate]);

    return (
    <div>
      <Toaster position="top-center" />
      <Header />
      <Slider />
      <Items />
      <Footer />
    </div>
  );
}
