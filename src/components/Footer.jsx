import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-8 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold mb-2 text-blue-300">Contract Assistant</h2>
            <p className="text-gray-300 text-sm">Professional guidance for UK building contracts</p>
          </div>
          
          <div className="flex items-center">
            <p className="text-gray-300 mr-2">© {new Date().getFullYear()} Contract Assistant</p>
            <span className="mx-2 text-gray-500">|</span>
            <a 
              href="https://www.zapt.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 transition duration-200 flex items-center"
            >
              Made on ZAPT
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}