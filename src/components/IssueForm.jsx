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
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-blue-700">
          {isFirst ? 'Primary Issue' : `Additional Issue #${issue.id}`}
        </h3>
        
        {canRemove && (
          <button 
            type="button"
            onClick={() => onRemove(issue.id)}
            className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded-full hover:bg-red-50 transition-colors"
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
            className="form-label"
          >
            Describe the specific issue*
          </label>
          <textarea
            id={`issue-${issue.id}-description`}
            value={issue.description}
            onChange={(e) => onChange(issue.id, 'description', e.target.value)}
            rows="3"
            className="form-input"
            placeholder="Explain the contract issue in detail"
          ></textarea>
          {errors[`issue-${issue.id}-description`] && (
            <p className="form-error">{errors[`issue-${issue.id}-description`]}</p>
          )}
        </div>
        
        <div>
          <label 
            htmlFor={`issue-${issue.id}-actionTaken`} 
            className="form-label"
          >
            Actions taken to date (if any)
          </label>
          <textarea
            id={`issue-${issue.id}-actionTaken`}
            value={issue.actionTaken}
            onChange={(e) => onChange(issue.id, 'actionTaken', e.target.value)}
            rows="2"
            className="form-input"
            placeholder="Describe any actions already taken regarding this issue"
          ></textarea>
        </div>
      </div>
    </div>
  );
}