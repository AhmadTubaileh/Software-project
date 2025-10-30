import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/Home.jsx';
import POS from './pages/POS.jsx';
import Employees from './pages/Employees.jsx';
import Items from './pages/Items.jsx';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/Employees" element={<Employees />} />
        <Route path="/items" element={<Items />} />
      </Routes>
    </Router>
  );
}

export default App;