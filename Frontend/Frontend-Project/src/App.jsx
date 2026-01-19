
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
import ProjectManagement from './pages/ProjectManagement.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import TaskArchive from './pages/TaskArchive.jsx';
import OverduePayments from './pages/OverduePayments.jsx';
import Returns from './pages/Returns.jsx';
import WorkerInventory from './pages/WorkerInventory.jsx';
import Branches from './pages/Branches.jsx'; // Make sure this import matches
import ContractBranches from './pages/ContractBranches.jsx';


import StoreHome from './pages/StoreHome.jsx'; //Ahmad new
import StoreProduct from './pages/StoreProduct.jsx';
import StoreCart from './pages/storeCart.jsx';
import BranchSelection from './pages/BranchSelection.jsx';
import MyInstallments from './pages/MyInstallments.jsx';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} /> 
        <Route path="/" element={<BranchSelection />} />
        <Route path="/store" element={<StoreHome />} />
        <Route path="/store/product/:id" element={<StoreProduct />} />
        <Route path="/storeCart" element={<StoreCart />} />
        <Route path="/my-installments" element={<MyInstallments />} />
        
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
        <Route path="/project-management" element={<ProjectManagement />} />
        <Route path="/project/:id" element={<ProjectDetails />} />
        <Route path="/task-archive" element={<TaskArchive />} />
        <Route path="/overdue-payments" element={<OverduePayments />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/worker-inventory" element={<WorkerInventory />} />
        <Route path="/branches" element={<Branches />} /> {/* CHANGED from /branch-management to /branches */}
        <Route path="/contract-branches" element={<ContractBranches />} />
      </Routes>
    </Router>
  );
}

export default App;