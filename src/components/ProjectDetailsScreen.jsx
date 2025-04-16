import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IssueForm from './IssueForm';
import { contractForms, organizationRoles } from '../data/contractData';

export default function ProjectDetailsScreen() {
  const navigate = useNavigate();
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
      // Save to localStorage for now
      localStorage.setItem('projectDetails', JSON.stringify(projectDetails));
      localStorage.setItem('issues', JSON.stringify(issues));
      
      // Navigate to the report screen
      navigate('/report');
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors((prev) => ({
        ...prev,
        form: 'An error occurred while submitting the form. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">Project Details</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Project Details Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Project Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name*
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={projectDetails.projectName}
                  onChange={handleProjectDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  placeholder="Enter project name"
                />
                {errors.projectName && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="formOfContract" className="block text-sm font-medium text-gray-700 mb-1">
                  Form of Contract*
                </label>
                <select
                  id="formOfContract"
                  name="formOfContract"
                  value={projectDetails.formOfContract}
                  onChange={handleProjectDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                >
                  <option value="">Select a contract form</option>
                  {contractForms.map((form) => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
                {errors.formOfContract && (
                  <p className="mt-1 text-sm text-red-600">{errors.formOfContract}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description*
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={projectDetails.projectDescription}
                  onChange={handleProjectDetailChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  placeholder="Briefly describe the project"
                ></textarea>
                {errors.projectDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectDescription}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="organizationRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Organization's Role*
                </label>
                <select
                  id="organizationRole"
                  name="organizationRole"
                  value={projectDetails.organizationRole}
                  onChange={handleProjectDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                >
                  <option value="">Select your role</option>
                  {organizationRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.organizationRole && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationRole}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Issues Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Contract Issues</h2>
            
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 cursor-pointer flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Issue
              </button>
            </div>
          </div>
          
          {errors.form && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-700">{errors.form}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer flex items-center"
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