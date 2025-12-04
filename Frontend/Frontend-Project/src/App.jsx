
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/Home.jsx';
import POS from './pages/POS.jsx';
import Employees from './pages/Employees.jsx';
import Items from './pages/Items.jsx';
import ContractApplication from './pages/ContractApplication.jsx';
import ContractManagement from './pages/ContractManagement.jsx';
import PaymentProcessing from './pages/PaymentProcessing.jsx';
import MyTasks from './pages/MyTasks.jsx';
import TimeTracking from './pages/TimeTracking.jsx';
import DutyHoursReport from './pages/DutyHoursReport.jsx';
import AdminDutyHours from './pages/AdminDutyHours.jsx';
import ProjectManagement from './pages/ProjectManagement.jsx'; // NEW
import ProjectDetails from './pages/ProjectDetails.jsx'; // NEW
import TaskArchive from './pages/TaskArchive.jsx'; // NEW


import StoreHome from './pages/StoreHome.jsx'; //Ahmad new
import StoreProduct from './pages/StoreProduct.jsx';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<StoreHome />} />{/*Ahmad New*/}
        <Route path="/store/product/:id" element={<StoreProduct />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/items" element={<Items />} />
        <Route path="/contract-application" element={<ContractApplication />} />
        <Route path="/contract-management" element={<ContractManagement />} />
        <Route path="/payment-processing" element={<PaymentProcessing />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/time-tracking" element={<TimeTracking />} />
        <Route path="/duty-hours-report" element={<DutyHoursReport />} />
        <Route path="/admin-duty-hours" element={<AdminDutyHours />} />
        <Route path="/project-management" element={<ProjectManagement />} /> {/* NEW */}
        <Route path="/project/:id" element={<ProjectDetails />} /> {/* NEW */}
        <Route path="/task-archive" element={<TaskArchive />} /> {/* NEW */}
      </Routes>
    </Router>
  );
}

export default App;