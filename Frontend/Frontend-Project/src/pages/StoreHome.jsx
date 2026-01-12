import React from "react";
import { Toaster } from "react-hot-toast";
import Header from "../components/store/Header";
import Slider from "../components/store/Slider";
import Items from "../components/store/Items";
import Footer from "../components/store/Footer";

import "../styles/store.css";   

export default function StoreHome() {
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
