import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateWordDocument } from '../utils/wordExport';
import * as Sentry from '@sentry/browser';

export default function SavedReportsScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [savedProjects, setSavedProjects] = useState([]);
  const [noProjects, setNoProjects] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loadingExport, setLoadingExport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (session) {
      loadProjectsFromDatabase();
    } else {
      // Fall back to localStorage for backward compatibility
      loadReportsFromLocalStorage();
    }
  }, [session]);
  
  const loadProjectsFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('Loading projects from database');
      
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.projects.length} projects from database`);
      
      if (data.projects.length === 0) {
        setNoProjects(true);
      } else {
        setSavedProjects(data.projects);
      }
    } catch (error) {
      console.error('Error loading projects from database:', error);
      Sentry.captureException(error);
      setError('Failed to load your saved projects. Please try again later.');
      
      // Fall back to localStorage
      console.log('Falling back to localStorage for saved reports');
      loadReportsFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadReportsFromLocalStorage = () => {
    try {
      console.log('Loading saved reports from localStorage');
      // Load saved reports from localStorage
      const storedReports = localStorage.getItem('savedReports');
      
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports);
        console.log(`Found ${parsedReports.length} saved reports in localStorage`);
        setSavedProjects(parsedReports);
        
        if (parsedReports.length === 0) {
          setNoProjects(true);
        }
      } else {
        console.log('No saved reports found in localStorage');
        setNoProjects(true);
      }
    } catch (error) {
      console.error('Error loading saved reports from localStorage:', error);
      Sentry.captureException(error);
      setNoProjects(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      if (session) {
        // Delete from database
        console.log(`Deleting project with ID: ${id} from database`);
        const response = await fetch(`/api/projects?projectId=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete project');
        }
        
        // Update state
        setSavedProjects(savedProjects.filter(project => project.id !== id));
        
        if (savedProjects.length <= 1) {
          setNoProjects(true);
        }
      } else {
        // Delete from localStorage
        console.log(`Deleting report with ID: ${id} from localStorage`);
        const updatedReports = savedProjects.filter(report => report.id !== id);
        
        // Update state
        setSavedProjects(updatedReports);
        
        // Update localStorage
        localStorage.setItem('savedReports', JSON.stringify(updatedReports));
        
        if (updatedReports.length === 0) {
          setNoProjects(true);
        }
      }
      
      showSuccessMessage('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      Sentry.captureException(error);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleViewProject = async (project) => {
    try {
      if (session) {
        // Navigate to the project details page with the project ID
        console.log(`Viewing project with ID: ${project.id}`);
        localStorage.setItem('currentProjectId', project.id);
        navigate(`/project-details?id=${project.id}`);
      } else {
        // Backward compatibility with localStorage
        console.log('Viewing report from localStorage');
        localStorage.setItem('projectDetails', JSON.stringify(project.projectDetails || {
          projectName: project.projectName,
          projectDescription: '',
          formOfContract: '',
          organizationRole: ''
        }));
        localStorage.setItem('issues', JSON.stringify(project.issues || []));
        localStorage.setItem('report', project.reportContent || '');
        
        // Navigate to the report screen
        navigate('/report');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Sentry.captureException(error);
      setError('Failed to load project. Please try again.');
    }
  };

  const handleExportToWord = async (project) => {
    setLoadingExport(true);
    try {
      console.log(`Exporting project to Word: ${project.projectName || project.id}`);
      // Format report content for Word export
      let formattedContent;
      
      if (session) {
        // We need to get the full project details including the report
        const response = await fetch(`/api/project?projectId=${project.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load project for export');
        }
        
        const data = await response.json();
        
        formattedContent = `<h1>Contract Analysis Report</h1>
          <h2>Project: ${data.projectDetails.projectName}</h2>
          <p><strong>Description:</strong> ${data.projectDetails.projectDescription}</p>
          <p><strong>Form of Contract:</strong> ${data.projectDetails.formOfContract}</p>
          <p><strong>Organization Role:</strong> ${data.projectDetails.organizationRole}</p>
          <h2>Issues</h2>`;
          
        // Add issues
        data.issues.forEach((issue, index) => {
          formattedContent += `<p><strong>Issue ${index + 1}:</strong> ${issue.description}</p>`;
          if (issue.actionTaken) {
            formattedContent += `<p><strong>Actions Taken:</strong> ${issue.actionTaken}</p>`;
          }
        });
        
        // Add report content
        formattedContent += `<h2>Analysis and Recommendations</h2>
          <p>${data.report?.replace(/\n/g, '<br/>') || 'No analysis available.'}</p>`;
      } else {
        // Legacy format from localStorage
        formattedContent = `<h1>Contract Analysis Report</h1>
          <h2>Project: ${project.projectName}</h2>
          <p><strong>Description:</strong> ${project.projectDetails?.projectDescription || 'Not specified'}</p>
          <p><strong>Form of Contract:</strong> ${project.projectDetails?.formOfContract || 'Not specified'}</p>
          <p><strong>Organization Role:</strong> ${project.projectDetails?.organizationRole || 'Not specified'}</p>
          <h2>Issues</h2>`;
          
        // Add issues
        const issues = project.issues || [];
        issues.forEach((issue, index) => {
          formattedContent += `<p><strong>Issue ${index + 1}:</strong> ${issue.description}</p>`;
          if (issue.actionTaken) {
            formattedContent += `<p><strong>Actions Taken:</strong> ${issue.actionTaken}</p>`;
          }
        });
        
        // Add report content
        formattedContent += `<h2>Analysis and Recommendations</h2>
          <p>${project.reportContent?.replace(/\n/g, '<br/>') || 'No analysis available.'}</p>`;
      }
      
      // Generate the Word document
      const projectName = project.projectName || project.id;
      const success = await generateWordDocument(
        formattedContent, 
        { 
          title: 'Contract Analysis Report', 
          projectName: projectName 
        },
        `contract-analysis-${projectName.toString().replace(/\s+/g, '-').toLowerCase()}`
      );
      
      if (success) {
        showSuccessMessage('Word document downloaded');
      } else {
        throw new Error('Failed to generate Word document');
      }
    } catch (error) {
      console.error('Error exporting to Word:', error);
      Sentry.captureException(error);
      setError('Failed to export to Word. Please try again.');
    } finally {
      setLoadingExport(false);
    }
  };

  const showSuccessMessage = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      Sentry.captureException(error);
      return 'Unknown date';
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 card flex justify-center items-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading your saved projects...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 card">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold">Saved Projects</h1>
        </div>
        
        <div className="p-6 text-center">
          <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (noProjects) {
    return (
      <div className="max-w-4xl mx-auto p-6 card">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold">Saved Projects</h1>
        </div>
        
        <div className="p-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Saved Projects</h2>
          <p className="text-gray-500 mb-6">You haven't saved any projects yet. Generate a report and save it to see it here.</p>
          <button
            onClick={() => navigate('/project-details')}
            className="btn-primary cursor-pointer"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold">Saved Projects</h1>
          <p className="mt-2 text-blue-100">
            {savedProjects.length} {savedProjects.length === 1 ? 'project' : 'projects'} saved
          </p>
        </div>
        
        {actionSuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {actionSuccess}
          </div>
        )}
        
        <div className="p-6">
          <div className="space-y-4">
            {savedProjects.map((project) => (
              <div key={project.id} className="bg-gray-50 p-4 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between mb-2">
                  <h2 className="text-lg font-semibold text-blue-800">
                    {session ? project.projectName : project.projectName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(project.createdAt || project.date)}
                  </p>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewProject(project)}
                    className="action-button bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    View Project
                  </button>
                  
                  <button
                    onClick={() => handleExportToWord(project)}
                    disabled={loadingExport}
                    className="action-button bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    {loadingExport ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Export to Word
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="action-button bg-red-600 hover:bg-red-700 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex items-center cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}