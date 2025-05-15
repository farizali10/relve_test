"use client";

import { useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Navigation from "@/components/Navigation";

export default function AIChatPage() {
  const { isAuth } = useSelector((state) => state.user);
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuth) {
      router.replace("/login");
    }
  }, [isAuth, router]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    if (isAuth) {
      setMessages([
        {
          from: "bot",
          text: "Hello! I'm your AI assistant. Ask me anything about your company, and I'll try to help you understand the organization better.",
        },
      ]);
    }
  }, [isAuth]);

  if (!isAuth) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: inputValue,
      },
    ]);
    
    // Clear input and show loading
    const question = inputValue;
    setInputValue("");
    setLoading(true);
    
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        "/api/ai-chat",
        { question },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.answer,
        },
      ]);
    } catch (error) {
      // Handle error
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: error.response?.data?.message || "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessages = () => {
    return messages.map((msg, idx) => (
      <div
        key={idx}
        className={`mb-4 max-w-3xl p-3 rounded-lg ${
          msg.from === "bot"
            ? "bg-gray-100 self-start"
            : "bg-blue-500 text-white self-end"
        }`}
      >
        {msg.text}
      </div>
    ));
  };

  return (
    <div className="flex min-h-screen bg-white flex-col">
      <Navigation />
      <div className="flex-1 p-8 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">AI Company Assistant</h1>
        
        <div className="flex-1 flex flex-col space-y-2 overflow-y-auto mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {renderMessages()}
          <div ref={messagesEndRef} />
          
          {loading && (
            <div className="self-start bg-gray-100 p-3 rounded-lg flex items-center">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your company..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading || !inputValue.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}