# Contract Assistant

Contract Assistant is an application designed to help parties involved in UK building contracts explore specific issues, including general queries regarding relevant clauses, disputes, or general concerns.

## Features

- Input project details including project name, description, form of contract, and your organization's role
- Submit specific contract issues and actions taken to date
- Receive detailed analysis and guidance on relevant contract clauses
- Generate professional draft communications based on the analysis
- Save reports for future reference
- Export reports as PDF, print, or copy to clipboard

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory with the required environment variables.

4. Start the development server:
   ```
   npm run dev
   ```

## Building for Production

To build the application for production:

```
npm run build
```

## Deployment

This application is configured for deployment on Vercel.

## Technology Stack

- React.js
- Tailwind CSS
- OpenAI GPT-4o API
- HTML2Canvas and jsPDF for document generation