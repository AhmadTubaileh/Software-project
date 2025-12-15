import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Mobile Pages
import MobileLogin from './pages/Login.jsx';
import MobileMyTasks from './pages/MyTasks.jsx';
import MobileTimeTracking from './pages/TimeTracking.jsx';
import MobileMyDutyHours from './pages/MyDutyHours.jsx';
import MobileProjectManagement from './pages/ProjectManagement.jsx';
import MobileProjectDetails from './pages/ProjectDetails.jsx';
import MobileAdminDutyHours from './pages/AdminDutyHours.jsx';
import MobileContractManagement from './pages/ContractManagement.jsx';

// Mobile Components
import MobileNav from './components/MobileNav.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Component to conditionally show navigation
function ConditionalNav() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return null;
  }

  return <MobileNav />;
}

function App() {
  return (
    <Router>
      <div className="mobile-app">
        <Routes>
          <Route path="/login" element={<MobileLogin />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/my-tasks" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <MobileMyTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/time-tracking"
            element={
              <ProtectedRoute>
                <MobileTimeTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-duty-hours"
            element={
              <ProtectedRoute>
                <MobileMyDutyHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-management"
            element={
              <ProtectedRoute>
                <MobileProjectManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:id"
            element={
              <ProtectedRoute>
                <MobileProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-duty-hours"
            element={
              <ProtectedRoute>
                <MobileAdminDutyHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contract-management"
            element={
              <ProtectedRoute>
                <MobileContractManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ConditionalNav />
      </div>
    </Router>
  );
}

export default App;