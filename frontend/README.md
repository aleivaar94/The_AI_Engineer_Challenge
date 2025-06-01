# OpenAI Chat Frontend

A modern React application that provides a beautiful interface for interacting with the OpenAI Chat API backend.

## Features

- 🎨 Modern, responsive UI with gradient design
- 💬 Real-time streaming chat responses
- 🔧 Configurable OpenAI model selection
- 🛡️ Form validation and error handling
- 🏥 API health checking
- 📱 Mobile-friendly responsive design

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- The backend API running on `http://localhost:8000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## How to Use

1. **Check API Health**: Click the "Check API Health" button to verify the backend is running
2. **Developer Message**: Enter system instructions or context for the AI
3. **User Message**: Enter your question or prompt
4. **Select Model**: Choose from available OpenAI models (default: gpt-4.1-mini)
5. **API Key**: Enter your OpenAI API key (starts with `sk-`)
6. **Send Message**: Click the submit button to get a streaming response

## API Integration

The frontend communicates with the FastAPI backend through:
- `POST /api/chat` - Sends chat requests and receives streaming responses
- `GET /api/health` - Checks backend health status

The Vite development server is configured to proxy API requests to `http://localhost:8000`.

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles and theme
│   └── main.jsx         # React application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Troubleshooting

- **API Connection Issues**: Ensure the backend is running on port 8000
- **CORS Errors**: The backend is configured to allow all origins
- **Streaming Issues**: Check browser console for network errors
- **API Key Errors**: Verify your OpenAI API key is valid and has sufficient credits