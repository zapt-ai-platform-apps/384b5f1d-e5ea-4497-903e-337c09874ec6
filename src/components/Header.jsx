import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Contract Assistant</Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/saved-reports" className="hover:text-blue-200 transition duration-200">
                Saved Reports
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}