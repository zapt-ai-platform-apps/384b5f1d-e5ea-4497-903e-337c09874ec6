import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/browser';

export default function SavedReportsScreen() {
  const navigate = useNavigate();
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
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
    setConfirmDelete(null);
  };
  
  const handleDeleteReport = (reportId) => {
    setConfirmDelete(reportId);
  };
  
  const confirmDeleteReport = (reportId) => {
    try {
      const updatedReports = savedReports.filter(report => report.id !== reportId);
      setSavedReports(updatedReports);
      localStorage.setItem('savedReports', JSON.stringify(updatedReports));
      
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(null);
      }
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      Sentry.captureException(error);
    }
  };
  
  const cancelDelete = () => {
    setConfirmDelete(null);
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
    
    // Replace markdown elements with properly styled HTML
    let formattedText = text
      // Replace markdown bold with styled spans
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Replace # headings with properly styled headings
      .replace(/^# (.*?)$/gm, '<h3 class="text-lg font-medium text-blue-700 mt-3 mb-2">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h4 class="text-base font-medium text-blue-600 mt-2 mb-1">$1</h4>')
      // Replace bullet points
      .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
      // Replace newlines with breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
      
    return `<p>${formattedText}</p>`;
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">Saved Reports</h1>
      
      {savedReports.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-700 mb-4">You don't have any saved reports yet.</p>
            <button
              onClick={() => navigate('/project-details')}
              className="btn-primary"
            >
              Start New Report
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="card p-4">
              <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Your Reports
              </h2>
              <ul className="divide-y divide-gray-200">
                {savedReports.map((report) => (
                  <li key={report.id} className="py-3">
                    <button
                      className={`w-full text-left p-3 rounded-md hover:bg-blue-50 transition-colors ${selectedReport?.id === report.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleSelectReport(report)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-blue-800">{report.projectName}</p>
                          <p className="text-sm text-gray-600">{formatDate(report.date)}</p>
                        </div>
                        {confirmDelete === report.id ? (
                          <div className="flex space-x-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmDeleteReport(report.id); }} 
                              className="text-white bg-red-600 p-1 rounded hover:bg-red-700"
                              title="Confirm Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                              className="text-white bg-gray-500 p-1 rounded hover:bg-gray-600"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
                            title="Delete Report"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/project-details')}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Report
                </button>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3">
            {selectedReport ? (
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-800">{selectedReport.projectName}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUseReport(selectedReport)}
                      className="btn-accent text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Use This Report
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">Created: {formatDate(selectedReport.date)}</p>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Project Details
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p><strong>Project Name:</strong> {selectedReport.projectDetails.projectName}</p>
                    <p><strong>Description:</strong> {selectedReport.projectDetails.projectDescription}</p>
                    <p><strong>Form of Contract:</strong> {selectedReport.projectDetails.formOfContract}</p>
                    <p><strong>Organization Role:</strong> {selectedReport.projectDetails.organizationRole}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h3>
                  <div className="space-y-2">
                    {selectedReport.issues.map((issue, index) => (
                      <div key={issue.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p><strong>Issue {index + 1}:</strong> {issue.description}</p>
                        {issue.actionTaken && (
                          <p><strong>Actions Taken:</strong> {issue.actionTaken}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                    </svg>
                    Analysis and Recommendations
                  </h3>
                  <div className="prose-custom max-w-none bg-gray-50 p-3 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: formatReportText(selectedReport.reportContent) }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-6 flex flex-col items-center justify-center" style={{ minHeight: "400px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-gray-500 mb-4">Select a report to view its details</p>
                <p className="text-sm text-gray-400">Your saved reports appear in the panel to the left</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}