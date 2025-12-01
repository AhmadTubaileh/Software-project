import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/Home.jsx';
import POS from './pages/POS.jsx';
import Employees from './pages/Employees.jsx';
import Items from './pages/Items.jsx';


import StoreHome from './pages/StoreHome.jsx'; //Ahmad new


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<StoreHome />} />{/*Ahmad New*/}
        <Route path="/pos" element={<POS />} />
        <Route path="/Employees" element={<Employees />} />
        <Route path="/items" element={<Items />} />
<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
      </Routes>
    </Router>
  );
}

export default App;