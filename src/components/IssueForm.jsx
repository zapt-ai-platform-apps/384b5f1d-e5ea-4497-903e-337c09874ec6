import React from 'react';

export default function IssueForm({ 
  issue, 
  onChange, 
  onRemove, 
  canRemove,
  isFirst,
  errors 
}) {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-800">
          {isFirst ? 'Primary Issue' : `Additional Issue #${issue.id}`}
        </h3>
        
        {canRemove && (
          <button 
            type="button"
            onClick={() => onRemove(issue.id)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
            aria-label="Remove issue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label 
            htmlFor={`issue-${issue.id}-description`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Describe the specific issue*
          </label>
          <textarea
            id={`issue-${issue.id}-description`}
            value={issue.description}
            onChange={(e) => onChange(issue.id, 'description', e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
            placeholder="Explain the contract issue in detail"
          ></textarea>
          {errors[`issue-${issue.id}-description`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`issue-${issue.id}-description`]}</p>
          )}
        </div>
        
        <div>
          <label 
            htmlFor={`issue-${issue.id}-actionTaken`} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Actions taken to date (if any)
          </label>
          <textarea
            id={`issue-${issue.id}-actionTaken`}
            value={issue.actionTaken}
            onChange={(e) => onChange(issue.id, 'actionTaken', e.target.value)}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
            placeholder="Describe any actions already taken regarding this issue"
          ></textarea>
        </div>
      </div>
    </div>
  );
}