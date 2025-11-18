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
import TaskManagement from './pages/TaskManagement.jsx'; // NEW
import MyTasks from './pages/MyTasks.jsx'; // NEW
import TimeTracking from './pages/TimeTracking.jsx';
import DutyHoursReport from './pages/DutyHoursReport.jsx';
import AdminDutyHours from './pages/AdminDutyHours.jsx';

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
        <Route path="/payment-processing" element={<PaymentProcessing />} />
        <Route path="/task-management" element={<TaskManagement />} /> {/* NEW */}
        <Route path="/my-tasks" element={<MyTasks />} /> {/* NEW */}
        <Route path="/time-tracking" element={<TimeTracking />} />
        <Route path="/duty-hours-report" element={<DutyHoursReport />} />
        <Route path="/admin-duty-hours" element={<AdminDutyHours />} />
      </Routes>
    </Router>
  );
}

export default App;