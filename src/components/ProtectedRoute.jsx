import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <p className="ml-3 text-blue-800 font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('User not authenticated, redirecting to auth screen');
    return <Navigate to="/auth" replace />;
  }

  return children;
}