import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/Home.jsx';
import POS from './pages/POS.jsx';
import Employees from './pages/Employees.jsx';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/employees" element={<Employees />} />
        
      </Routes>
    </Router>
  );
}

export default App;