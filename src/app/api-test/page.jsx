"use client";

import { useState } from "react";
import axios from "axios";
import Navigation from "@/components/Navigation";

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState(null);
  const [llamaStatus, setLlamaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [llamaLoading, setLlamaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [llamaError, setLlamaError] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/test-api");
      setApiStatus(data);
    } catch (err) {
      setError(err.response?.data || { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testLlamaAccess = async () => {
    setLlamaLoading(true);
    setLlamaError(null);
    try {
      const { data } = await axios.post("/api/test-api");
      setLlamaStatus(data);
    } catch (err) {
      setLlamaError(err.response?.data || { message: err.message });
    } finally {
      setLlamaLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white flex-col">
      <Navigation />
      <div className="flex-1 p-8 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>

        {/* Hugging Face API Key Test */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Hugging Face API Key Test</h2>
          <button
            onClick={testApiConnection}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 mb-4"
          >
            {loading ? "Testing..." : "Test API Key"}
          </button>

          {apiStatus && (
            <div className={`p-4 rounded-lg ${apiStatus.status === "success" ? "bg-green-100" : "bg-red-100"}`}>
              <h3 className="font-semibold">{apiStatus.message}</h3>
              <div className="mt-2">
                <p><strong>API Key Exists:</strong> {apiStatus.apiKeyExists ? "Yes" : "No"}</p>
                {apiStatus.apiKeyExists && (
                  <p><strong>API Key Valid:</strong> {apiStatus.apiKeyValid ? "Yes" : "No"}</p>
                )}
                {apiStatus.fullResponse && (
                  <div className="mt-2">
                    <p><strong>Full Model Response:</strong></p>
                    <pre className="bg-white p-3 rounded mt-1 whitespace-pre-wrap break-words text-sm">
                      {JSON.stringify(apiStatus.fullResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 rounded-lg">
              <h3 className="font-semibold">Error: {error.message}</h3>
              {error.error && <p className="mt-2">{error.error}</p>}
            </div>
          )}
        </div>

        {/* Llama Model Access Test */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Llama Model Access Test</h2>
          <button
            onClick={testLlamaAccess}
            disabled={llamaLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 mb-4"
          >
            {llamaLoading ? "Testing..." : "Test Llama Access"}
          </button>

          {llamaStatus && (
            <div className={`p-4 rounded-lg ${llamaStatus.status === "success" ? "bg-green-100" : "bg-red-100"}`}>
              <h3 className="font-semibold">{llamaStatus.message}</h3>
              {llamaStatus.fullResponse && (
                <div className="mt-2">
                  <p><strong>Full Model Response:</strong></p>
                  <pre className="bg-white p-3 rounded mt-1 whitespace-pre-wrap break-words text-sm">
                    {JSON.stringify(llamaStatus.fullResponse, null, 2)}
                  </pre>
                </div>
              )}
              {llamaStatus.error && (
                <div className="mt-2">
                  <p><strong>Error Details:</strong></p>
                  <p className="bg-white p-2 rounded mt-1">{llamaStatus.error}</p>
                </div>
              )}
            </div>
          )}

          {llamaError && (
            <div className="p-4 bg-red-100 rounded-lg">
              <h3 className="font-semibold">Error: {llamaError.message}</h3>
              {llamaError.error && <p className="mt-2">{llamaError.error}</p>}
            </div>
          )}
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Make sure your <code>.env.local</code> file contains a valid <code>HUGGINGFACE_API_KEY</code></li>
            <li>Verify that your Hugging Face account has accepted the Llama 2 model license at: <a href="https://huggingface.co/meta-llama/Llama-2-7b-chat-hf" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">https://huggingface.co/meta-llama/Llama-2-7b-chat-hf</a></li>
            <li>Make sure your API key has read access permissions</li>
            <li>If you're still having issues, try using an alternative model like "mistralai/Mistral-7B-Instruct-v0.2"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
