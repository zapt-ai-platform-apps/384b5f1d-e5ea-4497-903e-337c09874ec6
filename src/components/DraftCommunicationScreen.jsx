import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import * as Sentry from '@sentry/browser';

export default function DraftCommunicationScreen() {
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState(null);
  const [issues, setIssues] = useState([]);
  const [report, setReport] = useState('');
  const [draftCommunication, setDraftCommunication] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const communicationRef = useRef();
  
  useEffect(() => {
    // Load project details, issues, and report from localStorage
    const storedProjectDetails = localStorage.getItem('projectDetails');
    const storedIssues = localStorage.getItem('issues');
    const storedReport = localStorage.getItem('report');
    
    if (!storedProjectDetails || !storedIssues || !storedReport) {
      setError('Missing required data. Please go back and complete the previous steps.');
      setIsLoading(false);
      return;
    }
    
    try {
      const projectDetails = JSON.parse(storedProjectDetails);
      const issues = JSON.parse(storedIssues);
      
      setProjectDetails(projectDetails);
      setIssues(issues);
      setReport(storedReport);
      
      // Generate draft communication
      generateDraftCommunication(projectDetails, issues, storedReport);
    } catch (error) {
      console.error('Error loading data:', error);
      Sentry.captureException(error);
      setError('An error occurred while loading your data. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  const generateDraftCommunication = async (projectDetails, issues, report) => {
    setIsLoading(true);
    try {
      console.log('Sending request to generate draft communication API');
      const response = await fetch('/api/generateDraftCommunication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectDetails, issues, report }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate draft communication: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received draft communication data');
      setDraftCommunication(data.draftCommunication);
    } catch (error) {
      console.error('Error generating draft communication:', error);
      Sentry.captureException(error);
      setError('An error occurred while generating your draft communication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrint = useReactToPrint({
    content: () => communicationRef.current,
    onAfterPrint: () => {
      showSuccessMessage('Communication sent to printer');
    }
  });
  
  const handleCreatePDF = () => {
    const input = communicationRef.current;
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
      pdf.save('contract-assistant-draft-communication.pdf');
      showSuccessMessage('PDF downloaded');
    });
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draftCommunication)
      .then(() => {
        showSuccessMessage('Communication copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        Sentry.captureException(err);
      });
  };

  const handleEmailDraft = () => {
    const subject = encodeURIComponent(`Contract Communication: ${projectDetails.projectName}`);
    const body = encodeURIComponent(draftCommunication);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    showSuccessMessage('Email client opened');
  };

  const showSuccessMessage = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Function to format text by replacing markdown with proper HTML
  const formatCommunicationText = (text) => {
    if (!text) return '';
    
    // Replace common email/letter formatting patterns with styled HTML
    let formattedText = text
      // Preserve line breaks for addresses and signature blocks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
      
    return `<p>${formattedText}</p>`;
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 card flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
        <p className="text-xl text-gray-700">Drafting your communication...</p>
        <p className="text-sm text-gray-500 mt-2">We're creating a professional letter based on your contract analysis.</p>
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
          onClick={() => navigate('/report')}
          className="btn-primary"
        >
          Back to Report
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white">
          <h1 className="text-2xl font-bold">Draft Communication</h1>
          <p className="mt-2 text-green-100">
            Project: {projectDetails.projectName}
          </p>
        </div>
        
        <div className="bg-gray-100 px-6 py-4 flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={handlePrint}
            className="action-button bg-gray-600 hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print
          </button>
          
          <button
            onClick={handleCreatePDF}
            className="action-button bg-red-600 hover:bg-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Save as PDF
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="action-button bg-green-600 hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
            Copy to Clipboard
          </button>

          <button
            onClick={handleEmailDraft}
            className="action-button bg-blue-600 hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Email Draft
          </button>
        </div>
        
        {actionSuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {actionSuccess}
          </div>
        )}
        
        <div className="p-6" ref={communicationRef}>
          <div className="prose-custom max-w-none bg-gray-50 p-6 rounded-md border border-gray-200">
            {draftCommunication ? (
              <div dangerouslySetInnerHTML={{ __html: formatCommunicationText(draftCommunication) }} />
            ) : (
              <p>No draft communication available. Please try regenerating.</p>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => navigate('/report')}
            className="btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Report
          </button>
        </div>
      </div>
    </div>
  );
}