import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthScreen from './components/AuthScreen';
import DisclaimerScreen from './components/DisclaimerScreen';
import ProjectDetailsScreen from './components/ProjectDetailsScreen';
import ReportScreen from './components/ReportScreen';
import DraftCommunicationScreen from './components/DraftCommunicationScreen';
import SavedReportsScreen from './components/SavedReportsScreen';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-6">
            <Routes>
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DisclaimerScreen />
                </ProtectedRoute>
              } />
              <Route path="/project-details" element={
                <ProtectedRoute>
                  <ProjectDetailsScreen />
                </ProtectedRoute>
              } />
              <Route path="/report" element={
                <ProtectedRoute>
                  <ReportScreen />
                </ProtectedRoute>
              } />
              <Route path="/draft-communication" element={
                <ProtectedRoute>
                  <DraftCommunicationScreen />
                </ProtectedRoute>
              } />
              <Route path="/saved-reports" element={
                <ProtectedRoute>
                  <SavedReportsScreen />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}