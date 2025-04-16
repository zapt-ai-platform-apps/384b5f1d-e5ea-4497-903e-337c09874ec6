import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import ReportActions from './ReportActions';
import * as Sentry from '@sentry/browser';

export default function ReportScreen() {
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState(null);
  const [issues, setIssues] = useState([]);
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const reportRef = useRef();
  
  useEffect(() => {
    // Load project details and issues from localStorage
    const storedProjectDetails = localStorage.getItem('projectDetails');
    const storedIssues = localStorage.getItem('issues');
    
    if (!storedProjectDetails || !storedIssues) {
      setError('No project details found. Please go back and enter your project information.');
      setIsLoading(false);
      return;
    }
    
    try {
      setProjectDetails(JSON.parse(storedProjectDetails));
      setIssues(JSON.parse(storedIssues));
      
      // Generate report
      generateReport(JSON.parse(storedProjectDetails), JSON.parse(storedIssues));
    } catch (error) {
      console.error('Error loading data:', error);
      Sentry.captureException(error);
      setError('An error occurred while loading your project data. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  const generateReport = async (projectDetails, issues) => {
    setIsLoading(true);
    try {
      console.log('Sending request to generate report API');
      const response = await fetch('/api/generateReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectDetails, issues }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received report data');
      setReport(data.report);
      
      // Store the report in localStorage for the draft communication screen
      localStorage.setItem('report', data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      Sentry.captureException(error);
      setError('An error occurred while generating your report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveReport = () => {
    setIsSaving(true);
    try {
      // Get existing saved reports or initialize empty array
      const savedReports = JSON.parse(localStorage.getItem('savedReports')) || [];
      
      // Create new report object
      const newReport = {
        id: Date.now(),
        date: new Date().toISOString(),
        projectName: projectDetails.projectName,
        projectDetails,
        issues,
        reportContent: report
      };
      
      // Add to saved reports
      savedReports.push(newReport);
      
      // Save back to localStorage
      localStorage.setItem('savedReports', JSON.stringify(savedReports));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving report:', error);
      Sentry.captureException(error);
      setError('An error occurred while saving your report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
  });
  
  const handleCreatePDF = () => {
    const input = reportRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('contract-assistant-report.pdf');
    });
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(report)
      .then(() => {
        alert('Report copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        Sentry.captureException(err);
      });
  };
  
  const handleGenerateDraftCommunication = () => {
    navigate('/draft-communication');
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-700">Generating your report...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment while we analyze your contract details.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => navigate('/project-details')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
        >
          Back to Project Details
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-blue-700 text-white">
          <h1 className="text-2xl font-bold">Contract Analysis Report</h1>
          <p className="mt-2">
            Project: {projectDetails.projectName}
          </p>
        </div>
        
        <ReportActions 
          onSave={saveReport}
          onPrint={handlePrint}
          onCreatePDF={handleCreatePDF}
          onCopy={handleCopyToClipboard}
          onGenerateDraft={handleGenerateDraftCommunication}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
        />
        
        <div className="p-6" ref={reportRef}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Project Details</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Project Name:</strong> {projectDetails.projectName}</p>
              <p><strong>Description:</strong> {projectDetails.projectDescription}</p>
              <p><strong>Form of Contract:</strong> {projectDetails.formOfContract}</p>
              <p><strong>Organization Role:</strong> {projectDetails.organizationRole}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Issues Raised</h2>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div key={issue.id} className="bg-gray-50 p-4 rounded-md">
                  <p><strong>Issue {index + 1}:</strong> {issue.description}</p>
                  {issue.actionTaken && (
                    <p><strong>Actions Taken:</strong> {issue.actionTaken}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Analysis and Recommendations</h2>
            <div className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-md">
              {report ? (
                <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
              ) : (
                <p>No analysis available. Please try regenerating the report.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/project-details')}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 cursor-pointer"
            >
              Back to Project Details
            </button>
            
            <button
              onClick={handleGenerateDraftCommunication}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 cursor-pointer flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              Generate Draft Communication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}