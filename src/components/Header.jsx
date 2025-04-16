import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl md:text-2xl font-bold flex items-center transition duration-200 hover:text-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Contract Assistant
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link 
                  to="/" 
                  className={`hover:text-blue-200 transition duration-200 ${location.pathname === '/' ? 'font-medium text-white border-b-2 border-blue-300 pb-1' : 'text-blue-100'}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/project-details" 
                  className={`hover:text-blue-200 transition duration-200 ${location.pathname === '/project-details' ? 'font-medium text-white border-b-2 border-blue-300 pb-1' : 'text-blue-100'}`}
                >
                  New Analysis
                </Link>
              </li>
              <li>
                <Link 
                  to="/saved-reports" 
                  className={`hover:text-blue-200 transition duration-200 ${location.pathname === '/saved-reports' ? 'font-medium text-white border-b-2 border-blue-300 pb-1' : 'text-blue-100'}`}
                >
                  Saved Reports
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden rounded-md p-2 hover:bg-blue-600 transition duration-200 cursor-pointer"
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-2">
            <ul className="flex flex-col space-y-3">
              <li>
                <Link 
                  to="/" 
                  className={`block py-2 px-4 rounded-md ${location.pathname === '/' ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/project-details" 
                  className={`block py-2 px-4 rounded-md ${location.pathname === '/project-details' ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  New Analysis
                </Link>
              </li>
              <li>
                <Link 
                  to="/saved-reports" 
                  className={`block py-2 px-4 rounded-md ${location.pathname === '/saved-reports' ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Saved Reports
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}