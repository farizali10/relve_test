import React, { useState, useEffect } from 'react';
import { FaCog, FaRobot, FaServer, FaCloud } from 'react-icons/fa';

/**
 * AI Provider Configuration Component
 * Allows users to switch between different AI providers
 */
const AIProviderConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState('auto');
  const [ollamaStatus, setOllamaStatus] = useState('unknown');
  const [huggingFaceStatus, setHuggingFaceStatus] = useState('unknown');
  
  // Check Ollama status
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/version', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOllamaStatus('available');
          console.log('Ollama version:', data.version);
        } else {
          setOllamaStatus('error');
        }
      } catch (error) {
        console.log('Ollama not available:', error.message);
        setOllamaStatus('unavailable');
      }
    };
    
    checkOllama();
  }, []);
  
  // Check Hugging Face status
  useEffect(() => {
    // We can't directly check the API key validity from the client
    // So we'll just check if it's configured
    const checkHuggingFace = async () => {
      try {
        const response = await fetch('/api/check-hf-status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHuggingFaceStatus(data.status);
        } else {
          setHuggingFaceStatus('error');
        }
      } catch (error) {
        console.log('Error checking Hugging Face status:', error.message);
        setHuggingFaceStatus('error');
      }
    };
    
    checkHuggingFace();
  }, []);
  
  // Save provider preference
  const saveProviderPreference = async (newProvider) => {
    try {
      localStorage.setItem('aiProvider', newProvider);
      setProvider(newProvider);
      
      // Also save on the server if the user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/user-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ aiProvider: newProvider })
        });
      }
    } catch (error) {
      console.error('Error saving provider preference:', error);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Config button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        title="AI Provider Settings"
      >
        <FaCog className="w-5 h-5" />
      </button>
      
      {/* Config panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FaRobot className="mr-2" /> AI Provider
          </h3>
          
          <div className="space-y-3">
            {/* Auto (Best Available) */}
            <div 
              className={`flex items-center p-2 rounded cursor-pointer ${provider === 'auto' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => saveProviderPreference('auto')}
            >
              <input 
                type="radio" 
                name="provider" 
                checked={provider === 'auto'} 
                onChange={() => {}} 
                className="mr-2"
              />
              <div>
                <div className="font-medium">Auto (Best Available)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically selects the best available provider
                </div>
              </div>
            </div>
            
            {/* Ollama */}
            <div 
              className={`flex items-center p-2 rounded cursor-pointer ${provider === 'ollama' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => saveProviderPreference('ollama')}
            >
              <input 
                type="radio" 
                name="provider" 
                checked={provider === 'ollama'} 
                onChange={() => {}} 
                className="mr-2"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center">
                  <FaServer className="mr-1" /> Ollama (Local)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  {ollamaStatus === 'available' ? (
                    <span className="text-green-500 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Available
                    </span>
                  ) : ollamaStatus === 'unavailable' ? (
                    <span className="text-red-500 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> Not running
                    </span>
                  ) : (
                    <span className="text-yellow-500 flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Checking...
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Hugging Face */}
            <div 
              className={`flex items-center p-2 rounded cursor-pointer ${provider === 'huggingface' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => saveProviderPreference('huggingface')}
            >
              <input 
                type="radio" 
                name="provider" 
                checked={provider === 'huggingface'} 
                onChange={() => {}} 
                className="mr-2"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center">
                  <FaCloud className="mr-1" /> Hugging Face (Cloud)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  {huggingFaceStatus === 'available' ? (
                    <span className="text-green-500 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Available
                    </span>
                  ) : huggingFaceStatus === 'limited' ? (
                    <span className="text-yellow-500 flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Rate limited
                    </span>
                  ) : huggingFaceStatus === 'unavailable' ? (
                    <span className="text-red-500 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> Unavailable
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span> Unknown
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Ollama:</strong> Runs locally, no usage limits, requires installation
            </p>
            <p className="mt-1">
              <strong>Hugging Face:</strong> Cloud-based, may have usage limits
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProviderConfig;