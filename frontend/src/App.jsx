import React, { useState, useEffect } from 'react';

/**
 * Main Chat Application Component
 * Provides a user interface for interacting with the OpenAI Chat API and PDF RAG system
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
  
  // PDF-related state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState({ uploaded: false });
  const [ragMessage, setRagMessage] = useState('');
  const [ragResponse, setRagResponse] = useState('');
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'pdf'

  // API Key modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Regular chat conversation state
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: 'You are a helpful AI assistant.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = React.useRef(null);

  // Check PDF status on component mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
    checkPdfStatus();
  }, []);

  // When apiKey changes, update sessionStorage
  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  // Scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  /**
   * Check the status of uploaded PDF
   */
  const checkPdfStatus = async () => {
    try {
      const response = await fetch('/api/pdf-status');
      const status = await response.json();
      setPdfStatus(status);
    } catch (err) {
      console.error('Error checking PDF status:', err);
    }
  };

  /**
   * Handle file selection for PDF upload
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  /**
   * Handle PDF upload and indexing
   */
  const handlePdfUpload = async () => {
    if (!selectedFile || !formData.apiKey.trim()) {
      setError('Please select a PDF file and provide an API key');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('api_key', formData.apiKey);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setPdfStatus({ 
        uploaded: true, 
        message: result.message,
        chunks_count: result.chunks_count,
        total_characters: result.total_characters
      });
      setSelectedFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('pdf-file');
      if (fileInput) fileInput.value = '';
      
      alert(`PDF uploaded successfully! Processed ${result.chunks_count} chunks.`);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle RAG chat with PDF
   */
  const handleRagChat = async (e) => {
    e.preventDefault();
    
    if (!ragMessage.trim() || !formData.apiKey.trim()) {
      setError('Please enter a message and provide an API key');
      return;
    }

    if (!pdfStatus.uploaded) {
      setError('Please upload a PDF first');
      return;
    }

    setIsRagLoading(true);
    setError('');
    setRagResponse('');

    try {
      const response = await fetch('/api/chat-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: ragMessage,
          model: formData.model,
          api_key: formData.apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Chat failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setRagResponse(accumulatedResponse);
      }

    } catch (err) {
      console.error('Error in RAG chat:', err);
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setIsRagLoading(false);
    }
  };

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

  // API Key Modal handlers
  const handleApiKeyButton = () => {
    setShowApiKeyModal(true);
    setApiKeyInput(apiKey || '');
  };
  const handleApiKeySave = (e) => {
    e.preventDefault();
    setApiKey(apiKeyInput.trim());
    setShowApiKeyModal(false);
  };

  // Send user message and get assistant response
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !apiKey) return;
    setIsChatLoading(true);
    setError('');
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: userInput }]);
    setUserInput('');
    try {
      // Prepare messages for API (system + all previous + new user)
      const messages = chatHistory
        .filter(m => m.role !== 'assistant_stream')
        .concat({ role: 'user', content: userInput });
      // Streaming response
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developer_message: messages.find(m => m.role === 'system')?.content || '',
          user_message: messages.filter(m => m.role === 'user').map(m => m.content).join('\n'),
          model: formData.model,
          api_key: apiKey
        }),
      });
      if (!apiResponse.ok) throw new Error(`API Error: ${apiResponse.status}`);
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Failed to get response reader');
      let accumulated = '';
      // Add a streaming placeholder
      setChatHistory(prev => [...prev, { role: 'assistant_stream', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setChatHistory(prev => prev.map((msg, i) =>
          i === prev.length - 1 && msg.role === 'assistant_stream'
            ? { ...msg, content: accumulated }
            : msg
        ));
      }
      // Replace streaming placeholder with final assistant message
      setChatHistory(prev => prev.map((msg, i) =>
        i === prev.length - 1 && msg.role === 'assistant_stream'
          ? { role: 'assistant', content: accumulated }
          : msg
      ));
    } catch (err) {
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Application Header */}
      <header className="header" style={{ position: 'relative' }}>
        <h1>🤖 AI Chat Interface with PDF RAG</h1>
        <p>Chat with OpenAI models or upload a PDF and ask questions about it</p>
        {/* API Key Button */}
        <button
          className="api-key-btn"
          style={{ position: 'absolute', top: 20, right: 30 }}
          onClick={handleApiKeyButton}
        >
          {apiKey ? '🔑 API Key Set' : '🔑 Add API Key'}
        </button>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Enter your OpenAI API Key</h2>
            <form onSubmit={handleApiKeySave}>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                autoFocus
                className="api-key-input"
              />
              <button type="submit" className="submit-btn" style={{marginTop: 16}}>Enter</button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'regular' ? 'active' : ''}`}
          onClick={() => setActiveTab('regular')}
        >
          Regular Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'pdf' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdf')}
        >
          PDF Chat
        </button>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Regular Chat Tab */}
        {activeTab === 'regular' && (
          <div className="chat-outer">
            <div className="chat-history" ref={chatContainerRef}>
              {chatHistory.filter(m => m.role !== 'system').map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.role}`}> 
                  <span className="chat-bubble">{msg.content}</span>
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-msg assistant">
                  <span className="chat-bubble typing-indicator">AI is typing...</span>
                </div>
              )}
            </div>
            <form className="chat-input-row" onSubmit={handleChatSubmit}>
              <input
                type="text"
                className="chat-input"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isChatLoading}
                autoFocus
              />
              <button type="submit" className="chat-send-btn" disabled={isChatLoading || !userInput.trim()}>Send</button>
            </form>
          </div>
        )}

        {/* PDF Chat Tab */}
        {activeTab === 'pdf' && (
          <div className="pdf-chat-container">
            {/* PDF Upload Section */}
            <div className="pdf-upload-section">
              <h3>📄 Upload PDF</h3>
              
              {/* PDF Status */}
              {pdfStatus.uploaded ? (
                <div className="pdf-status success">
                  ✅ PDF Ready: {pdfStatus.message}
                  {pdfStatus.chunks_count && (
                    <div className="pdf-details">
                      Chunks: {pdfStatus.chunks_count} | Characters: {pdfStatus.total_characters?.toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pdf-status">
                  📋 No PDF uploaded yet
                </div>
              )}

              {/* API Key for PDF operations */}
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

              {/* File Upload */}
              <div className="form-group">
                <label htmlFor="pdf-file">
                  Select PDF File
                </label>
                <input
                  type="file"
                  id="pdf-file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <div className="selected-file">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>

              <button
                onClick={handlePdfUpload}
                className="upload-btn"
                disabled={!selectedFile || isUploading || !formData.apiKey}
              >
                {isUploading ? (
                  <span className="loading">
                    <span className="loading-spinner"></span>
                    Processing PDF...
                  </span>
                ) : (
                  '📤 Upload & Index PDF'
                )}
              </button>
            </div>

            {/* PDF Chat Section */}
            {pdfStatus.uploaded && (
              <div className="pdf-chat-section">
                <h3>💬 Chat with PDF</h3>
                <form onSubmit={handleRagChat}>
                  <div className="form-group">
                    <label htmlFor="ragMessage">
                      Ask a question about your PDF *
                    </label>
                    <textarea
                      id="ragMessage"
                      value={ragMessage}
                      onChange={(e) => setRagMessage(e.target.value)}
                      placeholder="What would you like to know about the PDF content?"
                      required
                    />
                  </div>

                  {/* Model Selection for RAG */}
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

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isRagLoading}
                  >
                    {isRagLoading ? (
                      <span className="loading">
                        <span className="loading-spinner"></span>
                        Analyzing PDF...
                      </span>
                    ) : (
                      '🔍 Ask PDF'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Regular Chat Response Display */}
        {activeTab === 'regular' && (response || isLoading) && (
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

        {/* RAG Chat Response Display */}
        {activeTab === 'pdf' && (ragResponse || isRagLoading) && (
          <div className="response-container">
            <h3>
              {isRagLoading ? (
                <span className="typing-indicator">🤖 AI is reading your PDF...</span>
              ) : (
                <span className="success-indicator">📖 PDF Analysis</span>
              )}
            </h3>
            <div className="response-text">
              {ragResponse || (isRagLoading ? 'Analyzing PDF content...' : '')}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
