import React, { useState } from 'react';

/**
 * Main Chat Application Component
 * Provides a user interface for interacting with the OpenAI Chat API
 */
function App() {
  // State management for form inputs and API responses
  const [formData, setFormData] = useState({
    developerMessage: '',
    userMessage: '',
    model: 'gpt-4.1-mini',
    apiKey: ''
  });
  
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles input changes for all form fields
   * @param {Event} e - The input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles form submission and streams the response from the API
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.developerMessage.trim() || !formData.userMessage.trim() || !formData.apiKey.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      // Make API request to the FastAPI backend
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: formData.developerMessage,
          user_message: formData.userMessage,
          model: formData.model,
          api_key: formData.apiKey
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      // Handle streaming response
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let accumulatedResponse = '';

      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and accumulate the response
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setResponse(accumulatedResponse);
      }

    } catch (err) {
      console.error('Error calling chat API:', err);
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks the health status of the API
   */
  const checkHealth = async () => {
    try {
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      
      if (healthData.status === 'ok') {
        setError('');
        alert('API is healthy and ready!');
      } else {
        setError('API health check failed');
      }
    } catch (err) {
      setError(`Health check failed: ${err.message}`);
    }
  };

  return (
    <div className="app">
      {/* Application Header */}
      <header className="header">
        <h1>🤖 OpenAI Chat Interface</h1>
        <p>Interact with OpenAI models through a beautiful, streaming interface</p>
        <button 
          onClick={checkHealth}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Check API Health
        </button>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <form onSubmit={handleSubmit}>
          {/* Developer/System Message Input */}
          <div className="form-group">
            <label htmlFor="developerMessage">
              Developer Message (System Prompt) *
            </label>
            <textarea
              id="developerMessage"
              name="developerMessage"
              value={formData.developerMessage}
              onChange={handleInputChange}
              placeholder="Enter the system message or instructions for the AI..."
              required
            />
          </div>

          {/* User Message Input */}
          <div className="form-group">
            <label htmlFor="userMessage">
              User Message *
            </label>
            <textarea
              id="userMessage"
              name="userMessage"
              value={formData.userMessage}
              onChange={handleInputChange}
              placeholder="Enter your question or prompt..."
              required
            />
          </div>

          {/* Model Selection */}
          <div className="form-group">
            <label htmlFor="model">
              OpenAI Model
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
            >
              <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          {/* API Key Input */}
          <div className="form-group">
            <label htmlFor="apiKey">
              OpenAI API Key *
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="sk-..."
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading">
                <span className="loading-spinner"></span>
                Generating Response...
              </span>
            ) : (
              '🚀 Send Message'
            )}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Response Display */}
        {(response || isLoading) && (
          <div className="response-container">
            <h3>
              {isLoading ? (
                <span className="typing-indicator">✨ AI is typing...</span>
              ) : (
                <span className="success-indicator">✅ Response</span>
              )}
            </h3>
            <div className="response-text">
              {response || (isLoading ? 'Waiting for response...' : '')}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
