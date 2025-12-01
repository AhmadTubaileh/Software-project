import React from "react";
import Header from "../components/store/Header";
import Slider from "../components/store/Slider";
import Items from "../components/store/Items";
import Footer from "../components/store/Footer";

import "../styles/store.css";   

export default function StoreHome() {
    return (
    <div>
      <Header />
      <Slider />
      <Items />
      <Footer />
    </div>
  );
}
