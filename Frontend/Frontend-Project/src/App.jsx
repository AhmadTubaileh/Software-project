import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/Home.jsx';
import POS from './pages/POS.jsx';
import Employees from './pages/Employees.jsx';
import Items from './pages/Items.jsx';
import ContractApplication from './pages/ContractApplication.jsx';
import ContractManagement from './pages/ContractManagement.jsx';
import PaymentProcessing from './pages/PaymentProcessing.jsx'; // NEW

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/items" element={<Items />} />
        <Route path="/contract-application" element={<ContractApplication />} />
        <Route path="/contract-management" element={<ContractManagement />} />
        <Route path="/payment-processing" element={<PaymentProcessing />} /> {/* NEW */}
      </Routes>
    </Router>
  );
}

export default App;