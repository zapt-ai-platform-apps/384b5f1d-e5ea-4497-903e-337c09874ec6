import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import IssueForm from './IssueForm';
import { contractForms, organizationRoles } from '../data/contractData';
import * as Sentry from '@sentry/browser';

export default function ProjectDetailsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  const [projectDetails, setProjectDetails] = useState({
    projectName: '',
    projectDescription: '',
    formOfContract: '',
    organizationRole: ''
  });
  
  const [issues, setIssues] = useState([
    { id: 1, description: '', actionTaken: '' }
  ]);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);

  // Check if we're editing an existing project
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id && session) {
      setIsLoading(true);
      setProjectId(id);
      
      const loadProject = async () => {
        try {
          console.log(`Loading project details for project ID: ${id}`);
          const response = await fetch(`/api/project?projectId=${id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to load project');
          }
          
          const data = await response.json();
          console.log('Project data loaded successfully');
          
          // Set project details
          setProjectDetails(data.projectDetails);
          
          // Set issues
          setIssues(data.issues);
          
          // Store report in localStorage for later
          if (data.report) {
            localStorage.setItem('report', data.report);
          }
          
        } catch (error) {
          console.error('Error loading project:', error);
          Sentry.captureException(error);
          setErrors({ form: 'Failed to load project. Please try again.' });
        } finally {
          setIsLoading(false);
        }
      };
      
      loadProject();
    } else {
      // Check for existing data in localStorage for backwards compatibility
      const storedProjectDetails = localStorage.getItem('projectDetails');
      const storedIssues = localStorage.getItem('issues');
      
      if (storedProjectDetails && storedIssues) {
        try {
          setProjectDetails(JSON.parse(storedProjectDetails));
          setIssues(JSON.parse(storedIssues));
        } catch (error) {
          console.error('Error parsing stored data:', error);
          Sentry.captureException(error);
        }
      }
    }
  }, [location.search, session]);

  const handleProjectDetailChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleIssueChange = (issueId, field, value) => {
    setIssues((prevIssues) => 
      prevIssues.map((issue) => 
        issue.id === issueId ? { ...issue, [field]: value } : issue
      )
    );
    
    // Clear error for this issue if it exists
    if (errors[`issue-${issueId}-${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`issue-${issueId}-${field}`]: null
      }));
    }
  };

  const addNewIssue = () => {
    const newIssueId = issues.length > 0 
      ? Math.max(...issues.map(issue => issue.id)) + 1 
      : 1;
      
    setIssues([...issues, { id: newIssueId, description: '', actionTaken: '' }]);
  };

  const removeIssue = (issueId) => {
    if (issues.length > 1) {
      setIssues(issues.filter(issue => issue.id !== issueId));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate project details
    if (!projectDetails.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    if (!projectDetails.projectDescription.trim()) {
      newErrors.projectDescription = 'Project description is required';
    }
    
    if (!projectDetails.formOfContract) {
      newErrors.formOfContract = 'Form of contract is required';
    }
    
    if (!projectDetails.organizationRole) {
      newErrors.organizationRole = 'Organization role is required';
    }
    
    // Validate issues
    issues.forEach(issue => {
      if (!issue.description.trim()) {
        newErrors[`issue-${issue.id}-description`] = 'Issue description is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to localStorage for backward compatibility and as a fallback
      localStorage.setItem('projectDetails', JSON.stringify(projectDetails));
      localStorage.setItem('issues', JSON.stringify(issues));
      
      // If user is logged in, save to database
      if (session) {
        console.log('Saving project to database');
        const method = projectId ? 'PUT' : 'POST';
        const url = projectId 
          ? `/api/projects?projectId=${projectId}` 
          : '/api/projects';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            projectDetails,
            issues
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save project: ${response.status}`);
        }
        
        // If this was a new project, store the ID for later use
        if (method === 'POST') {
          const data = await response.json();
          setProjectId(data.projectId);
          localStorage.setItem('currentProjectId', data.projectId);
          console.log(`New project saved with ID: ${data.projectId}`);
        } else {
          console.log(`Project updated successfully: ${projectId}`);
        }
      }
      
      // Navigate to the report screen
      navigate('/report');
    } catch (error) {
      console.error('Error submitting form:', error);
      Sentry.captureException(error);
      setErrors((prev) => ({
        ...prev,
        form: 'An error occurred while submitting the form. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto card p-6 flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto card p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
        {projectId ? 'Edit Project Details' : 'Project Details'}
      </h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Project Details Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Project Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectName" className="form-label">
                  Project Name*
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={projectDetails.projectName}
                  onChange={handleProjectDetailChange}
                  className="form-input box-border"
                  placeholder="Enter project name"
                />
                {errors.projectName && (
                  <p className="form-error">{errors.projectName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="formOfContract" className="form-label">
                  Form of Contract*
                </label>
                <select
                  id="formOfContract"
                  name="formOfContract"
                  value={projectDetails.formOfContract}
                  onChange={handleProjectDetailChange}
                  className="form-input box-border"
                >
                  <option value="">Select a contract form</option>
                  {contractForms.map((form) => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
                {errors.formOfContract && (
                  <p className="form-error">{errors.formOfContract}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="projectDescription" className="form-label">
                  Project Description*
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={projectDetails.projectDescription}
                  onChange={handleProjectDetailChange}
                  rows="3"
                  className="form-input box-border"
                  placeholder="Briefly describe the project"
                ></textarea>
                {errors.projectDescription && (
                  <p className="form-error">{errors.projectDescription}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="organizationRole" className="form-label">
                  Your Organization's Role*
                </label>
                <select
                  id="organizationRole"
                  name="organizationRole"
                  value={projectDetails.organizationRole}
                  onChange={handleProjectDetailChange}
                  className="form-input box-border"
                >
                  <option value="">Select your role</option>
                  {organizationRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.organizationRole && (
                  <p className="form-error">{errors.organizationRole}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Issues Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Contract Issues
            </h2>
            
            {issues.map((issue, index) => (
              <IssueForm
                key={issue.id}
                issue={issue}
                onChange={handleIssueChange}
                onRemove={removeIssue}
                canRemove={issues.length > 1}
                isFirst={index === 0}
                errors={errors}
              />
            ))}
            
            <div className="mt-4">
              <button
                type="button"
                onClick={addNewIssue}
                className="btn-accent inline-flex items-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Issue
              </button>
            </div>
          </div>
          
          {errors.form && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <p className="text-red-700">{errors.form}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Generate Report
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}