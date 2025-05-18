"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FaUser, FaRobot, FaPaperPlane } from "react-icons/fa";
import { Spinner } from "@/components/Spinner";
import AIProviderConfig from "@/components/AIProviderConfig";

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataCollectionMode, setDataCollectionMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const initChat = async () => {
      setLoading(true);
      try {
        // Check if we have all the required organization data
        const { data } = await axios.get("/api/check-data", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const missingData = data.missingData || [];
        
        if (missingData.length > 0) {
          // We need to collect organization data
          setDataCollectionMode(true);
          
          // Use AI-powered data collection
          const response = await axios.post(
            "/api/ai-data-collection",
            { 
              userMessage: "I want to start using the AI assistant",
              currentQuestion: null,
              collectedData: []
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          setCurrentQuestion(response.data.nextQuestion.dataType);
          
          setMessages([
            {
              from: "bot",
              text: response.data.conversationalResponse,
            },
          ]);
        } else {
          // We have all the organization data, check if we need business strategy data
          try {
            const strategyResponse = await axios.get("/api/business-strategy", {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (strategyResponse.data.hasOrganizationData && 
                strategyResponse.data.missingData && 
                strategyResponse.data.missingData.length > 0) {
              // We have organization data but need business strategy data
              setDataCollectionMode(true);
              
              // Use AI-powered data collection
              const response = await axios.post(
                "/api/ai-data-collection",
                { 
                  userMessage: "I want to start using the AI assistant",
                  currentQuestion: null,
                  collectedData: []
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              setCurrentQuestion(response.data.nextQuestion.dataType);
              
              setMessages([
                {
                  from: "bot",
                  text: response.data.conversationalResponse,
                },
              ]);
            } else {
              // All data is present, show welcome message
              setMessages([
                {
                  from: "bot",
                  text: "Hello! I'm your AI assistant. Ask me anything about your company, and I'll try to help you understand the organization better and identify potential gaps that might prevent you from reaching your business goals.",
                },
              ]);
            }
          } catch (strategyError) {
            console.error("Error checking business strategy data:", strategyError);
            
            // Try to create a new business strategy document and start collection
            try {
              const createResponse = await axios.post("/api/business-strategy", 
                { dataType: "init", value: "" },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (createResponse.data.missingData && createResponse.data.missingData.length > 0) {
                // Start business strategy data collection
                setDataCollectionMode(true);
                
                // Use AI-powered data collection
                const response = await axios.post(
                  "/api/ai-data-collection",
                  { 
                    userMessage: "I want to start using the AI assistant",
                    currentQuestion: null,
                    collectedData: []
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                setCurrentQuestion(response.data.nextQuestion.dataType);
                
                setMessages([
                  {
                    from: "bot",
                    text: response.data.conversationalResponse,
                  },
                ]);
              }
            } catch (createError) {
              console.error("Error creating business strategy document:", createError);
              setMessages([
                {
                  from: "bot",
                  text: "I'm having trouble setting up your business strategy data. Please try again later.",
                },
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        setMessages([
          {
            from: "bot",
            text: "I'm having trouble loading your data. Please try again later.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: userInput,
      },
    ]);

    setLoading(true);
    const token = Cookies.get("token");

    try {
      if (dataCollectionMode) {
        // We're in data collection mode - use AI-powered data collection
        const response = await axios.post(
          "/api/ai-data-collection",
          { 
            userMessage: userInput,
            currentQuestion,
            collectedData: messages
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: response.data.conversationalResponse,
          },
        ]);

        // Update current question if we have a next question
        if (response.data.nextQuestion) {
          setCurrentQuestion(response.data.nextQuestion.dataType);
        } else {
          // We've collected all data, switch to normal mode
          setDataCollectionMode(false);
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: "Thank you for providing all the necessary information! Now I can better assist you with questions about your organization. What would you like to know?",
            },
          ]);
        }
      } else {
        // We're in normal question mode
        try {
          // First check if we have all the required business strategy data
          const strategyResponse = await axios.get("/api/business-strategy", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (strategyResponse.data.missingData && strategyResponse.data.missingData.length > 0) {
            // We're missing business strategy data, switch to data collection mode
            setDataCollectionMode(true);
            
            // Use AI-powered data collection
            const response = await axios.post(
              "/api/ai-data-collection",
              { 
                userMessage: "I want to start using the AI assistant",
                currentQuestion: null,
                collectedData: []
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            setCurrentQuestion(response.data.nextQuestion.dataType);
            
            setMessages((prev) => [
              ...prev,
              {
                from: "bot",
                text: response.data.conversationalResponse,
              },
            ]);
            
            setLoading(false);
            return;
          }
          
          // If business strategy data is complete, proceed with normal question mode
          const { data } = await axios.post(
            "/api/ai-chat",
            { question: userInput },
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
          console.error("AI Chat Error:", error.response?.data);
          
          // If the error indicates missing business strategy data
          if (error.response?.status === 400 && error.response?.data?.missingBusinessStrategyData) {
            setDataCollectionMode(true);
            
            // Use AI-powered data collection
            const response = await axios.post(
              "/api/ai-data-collection",
              { 
                userMessage: "I want to start using the AI assistant",
                currentQuestion: null,
                collectedData: []
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            setCurrentQuestion(response.data.nextQuestion.dataType);
            
            setMessages((prev) => [
              ...prev,
              {
                from: "bot",
                text: response.data.conversationalResponse,
              },
            ]);
          } else {
            // Handle other errors
            setMessages((prev) => [
              ...prev,
              {
                from: "bot",
                text: "I'm sorry, I encountered an error while processing your question. Please try again.",
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I'm sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AI Company Assistant</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-[60vh] overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start mb-4 ${
              message.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[80%] ${
                message.from === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`rounded-full p-2 ${
                  message.from === "user" ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                {message.from === "user" ? (
                  <FaUser className="text-white" />
                ) : (
                  <FaRobot className="text-gray-700" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  message.from === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter the requested information..."
          className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-3 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaPaperPlane />
        </button>
      </form>
      
      {/* AI Provider Configuration */}
      <AIProviderConfig />
    </div>
  );
}