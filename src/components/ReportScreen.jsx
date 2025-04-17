import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import ReportActions from './ReportActions';
import * as Sentry from '@sentry/browser';
import { generateWordDocument } from '../utils/wordExport';

export default function ReportScreen() {
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState(null);
  const [issues, setIssues] = useState([]);
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const reportRef = useRef();
  
  useEffect(() => {
    // Load project details and issues from localStorage
    const storedProjectDetails = localStorage.getItem('projectDetails');
    const storedIssues = localStorage.getItem('issues');
    const storedReport = localStorage.getItem('report');
    
    if (!storedProjectDetails || !storedIssues) {
      setError('No project details found. Please go back and enter your project information.');
      setIsLoading(false);
      return;
    }
    
    try {
      setProjectDetails(JSON.parse(storedProjectDetails));
      setIssues(JSON.parse(storedIssues));
      
      // Check if we already have a report in localStorage (from saved reports)
      if (storedReport) {
        console.log('Using existing report from localStorage');
        setReport(storedReport);
        setIsLoading(false);
      } else {
        // Generate a new report only if we don't have one
        generateReport(JSON.parse(storedProjectDetails), JSON.parse(storedIssues));
      }
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
    documentTitle: `Contract Analysis: ${projectDetails?.projectName || 'Report'}`,
    onAfterPrint: () => {
      showSuccessMessage('Report sent to printer');
    },
    pageStyle: `
      @media print {
        body {
          font-family: Arial, Aptos, sans-serif;
          font-size: 12pt;
        }
        h1, h2, h3, h4 {
          font-family: Arial, Aptos, sans-serif;
        }
      }
    `,
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
      showSuccessMessage('PDF downloaded');
    });
  };
  
  const handleCopyToClipboard = () => {
    // Create a clean version of the report text for clipboard
    const textToCopy = report.replace(/#+\s/g, '').replace(/\*\*/g, '');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showSuccessMessage('Report copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        Sentry.captureException(err);
      });
  };
  
  const handleEmailReport = () => {
    // Create a clean version of the report text for email
    const cleanReport = report.replace(/#+\s/g, '').replace(/\*\*/g, '');
    
    const subject = encodeURIComponent(`Contract Analysis: ${projectDetails.projectName}`);
    const body = encodeURIComponent(`Contract Analysis Report\n\nProject: ${projectDetails.projectName}\n\n${cleanReport}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    showSuccessMessage('Email client opened');
  };

  const handleExportToWord = async () => {
    try {
      // Format report content for Word export
      const formattedContent = formatReportText(report);
      
      // Generate the Word document
      const success = await generateWordDocument(
        formattedContent, 
        { 
          title: 'Contract Analysis Report', 
          projectName: projectDetails.projectName 
        },
        `contract-analysis-${projectDetails.projectName.replace(/\s+/g, '-').toLowerCase()}`
      );
      
      if (success) {
        showSuccessMessage('Word document downloaded');
      } else {
        setError('Failed to generate Word document. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting to Word:', error);
      Sentry.captureException(error);
      setError('An error occurred while creating the Word document.');
    }
  };

  const showSuccessMessage = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };
  
  const handleGenerateDraftCommunication = () => {
    navigate('/draft-communication');
  };
  
  // Function to format text for display in the UI
  const formatReportText = (text) => {
    if (!text) return '';
    
    // Identify if the text already has HTML-like formatting
    const hasHtmlFormatting = /<\/?[a-z][\s\S]*>/i.test(text);
    
    if (hasHtmlFormatting) {
      // If it already has HTML formatting, just return it
      return text;
    }
    
    // Otherwise do our best to format it properly
    let formattedText = text
      // Handle section titles that might be in ALL CAPS or followed by colons
      .replace(/^([A-Z][A-Z\s]{2,}):?$/gm, '<h2 class="text-xl font-semibold text-blue-800 mt-4 mb-2">$1</h2>')
      // Replace any remaining markdown headings with styled HTML (in case they remain)
      .replace(/^# (.*?)$/gm, '<h2 class="text-xl font-semibold text-blue-800 mt-4 mb-2">$1</h2>')
      .replace(/^## (.*?)$/gm, '<h3 class="text-lg font-medium text-blue-700 mt-3 mb-2">$1</h3>')
      .replace(/^### (.*?)$/gm, '<h4 class="text-base font-medium text-blue-600 mt-2 mb-1">$1</h4>')
      // Replace bold markdown (in case it remains)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle section titles written like "1. Section Title"
      .replace(/^(\d+\.\s+)([A-Z].*?)$/gm, '<h3 class="text-lg font-medium text-blue-700 mt-3 mb-2">$1$2</h3>')
      // Replace bullet points
      .replace(/^- (.*?)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/^• (.*?)$/gm, '<li class="ml-4">• $1</li>')
      // Replace numbered lists but keep the numbers
      .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
      // Replace paragraph breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
      
    return `<p>${formattedText}</p>`;
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 card flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-700">Analyzing contract issues...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment as we review the relevant clauses and regulations.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 card">
        <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => navigate('/project-details')}
          className="btn-primary"
        >
          Back to Project Details
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden">
        <div className="card-header">
          <h1 className="text-2xl font-bold">Contract Analysis Report</h1>
          <p className="mt-2 text-blue-100">
            Project: {projectDetails.projectName}
          </p>
        </div>
        
        <ReportActions 
          onSave={saveReport}
          onPrint={handlePrint}
          onCreatePDF={handleCreatePDF}
          onCopy={handleCopyToClipboard}
          onEmail={handleEmailReport}
          onExportWord={handleExportToWord}
          onGenerateDraft={handleGenerateDraftCommunication}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
        />
        
        {actionSuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {actionSuccess}
          </div>
        )}
        
        <div className="p-6" ref={reportRef}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Project Details
            </h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p><strong>Project Name:</strong> {projectDetails.projectName}</p>
              <p><strong>Description:</strong> {projectDetails.projectDescription}</p>
              <p><strong>Form of Contract:</strong> {projectDetails.formOfContract}</p>
              <p><strong>Organization Role:</strong> {projectDetails.organizationRole}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Issues Raised
            </h2>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div key={issue.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p><strong>Issue {index + 1}:</strong> {issue.description}</p>
                  {issue.actionTaken && (
                    <p><strong>Actions Taken:</strong> {issue.actionTaken}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
              </svg>
              Analysis and Recommendations
            </h2>
            <div className="prose-custom max-w-none bg-gray-50 p-4 rounded-md border border-gray-200">
              {report ? (
                <div dangerouslySetInnerHTML={{ __html: formatReportText(report) }} />
              ) : (
                <p>No analysis available. Please try regenerating the report.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={() => navigate('/project-details')}
              className="btn-secondary flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Project Details
            </button>
            
            <button
              onClick={handleGenerateDraftCommunication}
              className="btn-accent flex items-center justify-center"
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