import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/browser';

export default function SavedReportsScreen() {
  const navigate = useNavigate();
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  
  useEffect(() => {
    try {
      // Load saved reports from localStorage
      const reports = JSON.parse(localStorage.getItem('savedReports')) || [];
      setSavedReports(reports.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error loading saved reports:', error);
      Sentry.captureException(error);
    }
  }, []);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleSelectReport = (report) => {
    setSelectedReport(report);
  };
  
  const handleDeleteReport = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const updatedReports = savedReports.filter(report => report.id !== reportId);
        setSavedReports(updatedReports);
        localStorage.setItem('savedReports', JSON.stringify(updatedReports));
        
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(null);
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        Sentry.captureException(error);
      }
    }
  };
  
  const handleUseReport = (report) => {
    try {
      console.log('Using saved report:', report.projectName);
      
      // Store the report data in localStorage for use in the report screen
      localStorage.setItem('projectDetails', JSON.stringify(report.projectDetails));
      localStorage.setItem('issues', JSON.stringify(report.issues));
      localStorage.setItem('report', report.reportContent);
      
      // Navigate to the report screen
      navigate('/report');
    } catch (error) {
      console.error('Error using saved report:', error);
      Sentry.captureException(error);
    }
  };
  
  // Function to format text by replacing markdown with proper HTML
  const formatReportText = (text) => {
    if (!text) return '';
    
    // Replace markdown headings with properly styled headings
    let formattedText = text
      // Replace markdown bold with styled spans
      .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>')
      // Replace # headings with properly styled headings
      .replace(/^# (.*?)$/gm, '<h3 class="text-lg font-medium text-blue-700 mt-3 mb-2">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h4 class="text-base font-medium text-blue-600 mt-2 mb-1">$1</h4>')
      // Replace newlines with breaks
      .replace(/\n/g, '<br />');
      
    return formattedText;
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">Saved Reports</h1>
      
      {savedReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 mb-4">You don't have any saved reports yet.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            Start New Report
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Your Reports</h2>
              <ul className="divide-y divide-gray-200">
                {savedReports.map((report) => (
                  <li key={report.id} className="py-3">
                    <button
                      className={`w-full text-left p-3 rounded-md hover:bg-blue-50 transition ${selectedReport?.id === report.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleSelectReport(report)}
                    >
                      <p className="font-medium">{report.projectName}</p>
                      <p className="text-sm text-gray-600">{formatDate(report.date)}</p>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
                >
                  Create New Report
                </button>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3">
            {selectedReport ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-800">{selectedReport.projectName}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUseReport(selectedReport)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 cursor-pointer text-sm"
                    >
                      Use This Report
                    </button>
                    <button
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 cursor-pointer text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">Created: {formatDate(selectedReport.date)}</p>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Project Details</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p><strong>Project Name:</strong> {selectedReport.projectDetails.projectName}</p>
                    <p><strong>Description:</strong> {selectedReport.projectDetails.projectDescription}</p>
                    <p><strong>Form of Contract:</strong> {selectedReport.projectDetails.formOfContract}</p>
                    <p><strong>Organization Role:</strong> {selectedReport.projectDetails.organizationRole}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Issues</h3>
                  <div className="space-y-2">
                    {selectedReport.issues.map((issue, index) => (
                      <div key={issue.id} className="bg-gray-50 p-3 rounded-md">
                        <p><strong>Issue {index + 1}:</strong> {issue.description}</p>
                        {issue.actionTaken && (
                          <p><strong>Actions Taken:</strong> {issue.actionTaken}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Analysis and Recommendations</h3>
                  <div className="prose prose-blue max-w-none bg-gray-50 p-3 rounded-md max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: formatReportText(selectedReport.reportContent) }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center" style={{ minHeight: "400px" }}>
                <p className="text-gray-500">Select a report to view its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}