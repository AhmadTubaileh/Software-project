import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Employee Pages
import MobileLogin from './pages/Login.jsx';
import MobileMyTasks from './pages/MyTasks.jsx';
import MobileTimeTracking from './pages/TimeTracking.jsx';
import MobileMyDutyHours from './pages/MyDutyHours.jsx';
import MobileProjectManagement from './pages/ProjectManagement.jsx';
import MobileProjectDetails from './pages/ProjectDetails.jsx';
import MobileAdminDutyHours from './pages/AdminDutyHours.jsx';
import MobileContractManagement from './pages/ContractManagement.jsx';

// Customer Store Pages
import BranchSelection from './pages/store/BranchSelection.jsx';
import StoreHome from './pages/store/StoreHome.jsx';
import ProductDetail from './pages/store/ProductDetail.jsx';
import Cart from './pages/store/Cart.jsx';
import CategoryPage from './pages/store/CategoryPage.jsx';
import MyOrders from './pages/store/MyOrders.jsx';
import MyInstallments from './pages/store/MyInstallments.jsx';
import OrderDetails from './pages/store/OrderDetails.jsx';

// Mobile Components
import MobileNav from './components/MobileNav.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Component to conditionally show navigation
function ConditionalNav() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isStorePage = location.pathname === '/' || location.pathname.startsWith('/store');

  if (isLoginPage || isStorePage) {
    return null;
  }

  return <MobileNav />;
}

function App() {
  return (
    <Router>
      <div className="mobile-app">
        <Toaster position="top-center" />
        <Routes>
          {/* Customer Store Routes */}
          <Route path="/" element={<BranchSelection />} />
          <Route path="/store" element={<StoreHome />} />
          <Route path="/store/product/:id" element={<ProductDetail />} />
          <Route path="/store/cart" element={<Cart />} />
          <Route path="/store/category/:slug" element={<CategoryPage />} />
          <Route path="/store/my-orders" element={<MyOrders />} />
          <Route path="/store/my-installments" element={<MyInstallments />} />
          <Route path="/store/order/:orderId" element={<OrderDetails />} />

          {/* Employee Routes */}
          <Route path="/login" element={<MobileLogin />} />
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