import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DisclaimerScreen() {
  const [userConsent, setUserConsent] = useState(null);
  const navigate = useNavigate();

  const handleConsent = (consent) => {
    setUserConsent(consent);
    if (consent) {
      navigate('/project-details');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
        Welcome to Contract Assistant
      </h1>
      
      <div className="prose prose-blue max-w-none">
        <p className="mb-4">
          Contract Assistant is designed to help any party involved in a UK building contract, 
          whether a Client, Main Contractor or Sub-contractor, explore specific issues, 
          including general queries regarding relevant clauses, disputes or general concerns.
        </p>
        
        <p className="mb-4">
          Simply input your query and Contract Assistant will return an appropriate response 
          or provide an indication of what recourse might be available within the Contract 
          to resolve the issues described.
        </p>
        
        <p className="mb-4 font-semibold">
          Please be aware that the information and responses provided within this app are for 
          informational and educational purposes only. They are not intended to constitute, 
          nor should they be considered as, legal or contractual advice.
        </p>
        
        <p className="mb-4">
          We strongly recommend that you consult with a qualified Legal Professional before 
          making any decisions or taking any legal actions based on the content in this app. 
          Our resources are designed to guide and inform, but your actual contractual situation 
          may require specialist professional contractual / legal advice tailored to your specific needs.
        </p>
        
        <p className="mb-6 font-semibold">
          If you wish to continue, please confirm below that you understand that the Contract 
          Assistant app does not provide contractual or legal advice and is intended for 
          information and education purposes only.
        </p>
      </div>
      
      <div className="mt-8 text-center">
        <p className="mb-4 font-bold text-lg">
          Do you understand and consent to these terms?
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleConsent(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            Yes, I Understand
          </button>
          
          <button
            onClick={() => handleConsent(false)}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 cursor-pointer"
          >
            No, Exit
          </button>
        </div>
        
        {userConsent === false && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-blue-800">
              Thank you for your interest in Contract Assistant. We respect your decision.
              You may close this application now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}