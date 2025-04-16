import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DisclaimerScreen from './components/DisclaimerScreen';
import ProjectDetailsScreen from './components/ProjectDetailsScreen';
import ReportScreen from './components/ReportScreen';
import DraftCommunicationScreen from './components/DraftCommunicationScreen';
import SavedReportsScreen from './components/SavedReportsScreen';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<DisclaimerScreen />} />
            <Route path="/project-details" element={<ProjectDetailsScreen />} />
            <Route path="/report" element={<ReportScreen />} />
            <Route path="/draft-communication" element={<DraftCommunicationScreen />} />
            <Route path="/saved-reports" element={<SavedReportsScreen />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}