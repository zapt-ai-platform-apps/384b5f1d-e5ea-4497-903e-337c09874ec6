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
    });
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draftCommunication)
      .then(() => {
        alert('Draft communication copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        Sentry.captureException(err);
      });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-700">Generating your draft communication...</p>
        <p className="text-sm text-gray-500 mt-2">We're creating a professional communication based on your contract analysis.</p>
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
          onClick={() => navigate('/report')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
        >
          Back to Report
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-green-700 text-white">
          <h1 className="text-2xl font-bold">Draft Communication</h1>
          <p className="mt-2">
            Project: {projectDetails.projectName}
          </p>
        </div>
        
        <div className="bg-gray-100 px-6 py-4 flex flex-wrap items-center space-x-2 border-b border-gray-200">
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200 cursor-pointer mb-2 sm:mb-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print
          </button>
          
          <button
            onClick={handleCreatePDF}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 cursor-pointer mb-2 sm:mb-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Save as PDF
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 cursor-pointer mb-2 sm:mb-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
        
        <div className="p-6" ref={communicationRef}>
          <div className="prose prose-lg max-w-none bg-gray-50 p-4 rounded-md border border-gray-200">
            {draftCommunication ? (
              <div dangerouslySetInnerHTML={{ __html: draftCommunication.replace(/\n/g, '<br />') }} />
            ) : (
              <p>No draft communication available. Please try regenerating.</p>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => navigate('/report')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            Back to Report
          </button>
        </div>
      </div>
    </div>
  );
}