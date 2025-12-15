import React from 'react';
import { Navigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';

function ProtectedRoute({ children }) {
  const { currentUser } = useLocalSession();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
