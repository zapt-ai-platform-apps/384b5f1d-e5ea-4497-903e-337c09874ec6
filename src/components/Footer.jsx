import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} Contract Assistant</p>
        <p className="text-sm mt-1">
          <a 
            href="https://www.zapt.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 transition duration-200"
          >
            Made on ZAPT
          </a>
        </p>
      </div>
    </footer>
  );
}