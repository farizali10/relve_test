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
  const [dataCollectionMode, setDataCollectionMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [collectedData, setCollectedData] = useState({});
  const [dataRequirements, setDataRequirements] = useState({
    organizationName: false,
    industry: false,
    companySize: false,
    ceoName: false,
    ceoEmail: false,
    departments: []
  });
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

  // Check if all required data is present
  useEffect(() => {
    if (isAuth) {
      checkRequiredData();
    }
  }, [isAuth]);

  // Function to check what data is missing
  const checkRequiredData = async () => {
    try {
      const token = Cookies.get("token");
      
      // First check if organization data exists
      try {
        const { data } = await axios.get("/api/check-data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (data.missingData && data.missingData.length > 0) {
          // Organization data is missing, start collecting it
          setDataCollectionMode(true);
          setDataRequirements(data.dataRequirements);
          
          // Start the guided data collection process
          startDataCollection(data.missingData[0]);
          return;
        }
        
        // Organization data is complete, now check business strategy data
        try {
          const strategyResponse = await axios.get("/api/business-strategy", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (strategyResponse.data.hasOrganizationData && 
              strategyResponse.data.missingData && 
              strategyResponse.data.missingData.length > 0) {
            // We have organization data but need business strategy data
            setDataCollectionMode(true);
            setCurrentQuestion("businessStrategyIntro");
            
            // First show an introduction message for business strategy data collection
            setMessages([
              {
                from: "bot",
                text: "Before I can answer your questions, I need more information about your business strategy. Missing data: organizational problems, user & organizational strategy, unique value proposition, solution & distribution strategy, management & systems strategy, business outcomes, cost structure, people strategy"
              }
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
              setCurrentQuestion("businessStrategyIntro");
              
              // First show an introduction message for business strategy data collection
              setMessages(prevMessages => [
                ...prevMessages,
                {
                  from: "bot",
                  text: "Before I can answer your questions, I need more information about your business strategy. Missing data: organizational problems, user & organizational strategy, unique value proposition, solution & distribution strategy, management & systems strategy, business outcomes, cost structure, people strategy"
                }
              ]);
              return;
            }
          } catch (createError) {
            console.error("Error creating business strategy document:", createError);
          }
          
          // Fall back to basic welcome message
          setMessages([
            {
              from: "bot",
              text: "Hello! I'm your AI assistant. Ask me anything about your company, and I'll try to help you understand the organization better.",
            },
          ]);
        }
      } catch (orgError) {
        console.error("Error checking organization data:", orgError);
        // Show welcome message with a note about missing organization data
        setMessages([
          {
            from: "bot",
            text: "Hello! I'm your AI assistant. I need some information about your organization before I can assist you fully. Let's start by setting up your organization details.",
          },
        ]);
        
        // Start organization data collection with a default field
        setDataCollectionMode(true);
        startDataCollection("organizationName");
      }
    } catch (error) {
      console.error("Error checking required data:", error);
      // Show welcome message with a note about potential missing data
      setMessages([
        {
          from: "bot",
          text: "Hello! I'm your AI assistant. I might not have all the information about your company yet. Please provide details when prompted, or set up your organization information first.",
        },
      ]);
    }
  };

  // Function to start the data collection process
  const startDataCollection = (missingDataType) => {
    setCurrentQuestion(missingDataType);
    
    let questionText = "";
    switch (missingDataType) {
      case "organizationName":
        questionText = "I need some information about your company before I can assist you. What is the name of your organization?";
        break;
      case "industry":
        questionText = "What industry does your company operate in? (e.g., Healthcare, Finance, IT, etc.)";
        break;
      case "companySize":
        questionText = "How many employees does your company have? Please select a range: 150-300, 300-450, 450-600, 600-850, 850-1000, or 1000+";
        break;
      case "ceoName":
        questionText = "Who is the CEO of your company?";
        break;
      case "ceoEmail":
        questionText = "What is the email address of your CEO?";
        break;
      case "departments":
        questionText = "Let's add a department to your organization. What is the name of a department in your company?";
        break;
      default:
        questionText = "I need more information about your company. What would you like to tell me?";
    }
    
    setMessages([
      {
        from: "bot",
        text: questionText,
      },
    ]);
  };

  // Function to process the collected data
  const processCollectedData = async (dataType, value) => {
    // Update the collected data
    const updatedData = { ...collectedData, [dataType]: value };
    setCollectedData(updatedData);
    
    // Mark this data type as collected
    const updatedRequirements = { ...dataRequirements };
    if (dataType === "departments") {
      updatedRequirements.departments.push(value);
    } else {
      updatedRequirements[dataType] = true;
    }
    setDataRequirements(updatedRequirements);
    
    // Save the collected data to the database
    try {
      const token = Cookies.get("token");
      await axios.post(
        "/api/save-data",
        { dataType, value },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Check if we need to collect more data
      const missingData = getMissingDataTypes(updatedRequirements);
      
      if (missingData.length > 0) {
        // Continue collecting data
        const nextDataType = missingData[0];
        setCurrentQuestion(nextDataType);
        
        // Ask the next question
        let nextQuestion = "";
        switch (nextDataType) {
          case "industry":
            nextQuestion = "Thank you! What industry does your company operate in?";
            break;
          case "companySize":
            nextQuestion = "Great! How many employees does your company have? Please select a range: 150-300, 300-450, 450-600, 600-850, 850-1000, or 1000+";
            break;
          case "ceoName":
            nextQuestion = "Who is the CEO of your company?";
            break;
          case "ceoEmail":
            nextQuestion = "What is the email address of your CEO?";
            break;
          case "departments":
            if (updatedRequirements.departments.length === 0) {
              nextQuestion = "Let's add a department to your organization. What is the name of a department in your company?";
            } else if (updatedRequirements.departments.length < 3) {
              nextQuestion = `Thanks for adding the ${updatedRequirements.departments[updatedRequirements.departments.length - 1]} department. Would you like to add another department? If yes, please provide the department name, or type "done" if you're finished adding departments.`;
            }
            break;
          default:
            nextQuestion = "I need more information. Please provide details for: " + nextDataType;
        }
        
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: nextQuestion,
          },
        ]);
      } else {
        // All data has been collected
        setDataCollectionMode(false);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Thank you for providing all the necessary information! Now I can better assist you with questions about your organization. What would you like to know?",
          },
        ]);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I had trouble saving that information. Could you please try again?",
        },
      ]);
    }
  };

  // Function to start business strategy data collection
  const startBusinessStrategyCollection = (dataType) => {
    setCurrentQuestion(dataType);
    setDataCollectionMode(true);
    
    let questionText = "";
    switch (dataType) {
      case "organizationProblems":
        questionText = "To help me better understand your organization, could you define your top 3 organizational problems? This will help ground my analysis in your real business context.";
        break;
      case "userStrategy":
        questionText = "Please tell me about your User & Organizational Strategy. Who are your target segments and what are your growth plans?";
        break;
      case "valueProposition":
        questionText = "What is your organization's Unique Value Proposition (UVP)? This helps me understand what makes your company different.";
        break;
      case "solutionStrategy":
        questionText = "Please describe your Solution and Distribution Strategy. How do you market and roll out initiatives?";
        break;
      case "managementStrategy":
        questionText = "What is your high-level Management & Systems Strategy? This includes tools, processes, and governance structures.";
        break;
      case "businessOutcomes":
        questionText = "What are your key business outcomes? This could include revenue targets, time-to-hire goals, and retention objectives.";
        break;
      case "costStructure":
        questionText = "Please tell me about your Cost Structure constraints, such as budget per department and headcount caps.";
        break;
      case "peopleStrategy":
        questionText = "What is your People Strategy? This includes critical roles, skill priorities, and bench strength.";
        break;
      default:
        questionText = "I need more information about your business strategy. What would you like to tell me?";
    }
    
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: questionText,
      },
    ]);
  };

  // Function to process collected business strategy data
  const processBusinessStrategyData = async (dataType, value) => {
    try {
      const token = Cookies.get("token");
      await axios.post(
        "/api/business-strategy",
        { dataType, value },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Check if we need to collect more strategy data
      const { data } = await axios.get("/api/business-strategy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.missingData && data.missingData.length > 0) {
        // Continue collecting data
        const nextDataType = data.missingData[0];
        setCurrentQuestion(nextDataType);
        
        // Ask the next question
        startBusinessStrategyCollection(nextDataType);
      } else {
        // All data has been collected
        setDataCollectionMode(false);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Thank you for providing all the business strategy information! Now I can better assist you with questions about your organization and help identify potential gaps that might prevent you from reaching your business goals. What would you like to know?",
          },
        ]);
      }
    } catch (error) {
      console.error("Error saving business strategy data:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I had trouble saving that information. Could you please try again?",
        },
      ]);
    }
  };

  // Helper function to get missing data types
  const getMissingDataTypes = (requirements) => {
    const missingTypes = [];
    
    if (!requirements.organizationName) missingTypes.push("organizationName");
    if (!requirements.industry) missingTypes.push("industry");
    if (!requirements.companySize) missingTypes.push("companySize");
    if (!requirements.ceoName) missingTypes.push("ceoName");
    if (!requirements.ceoEmail) missingTypes.push("ceoEmail");
    if (requirements.departments.length < 1) missingTypes.push("departments");
    
    return missingTypes;
  };

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
    const userInput = inputValue;
    setInputValue("");
    setLoading(true);
    
    if (dataCollectionMode) {
      // We're in data collection mode, process the input as data
      const response = userInput.trim();
      
      // Check if we're collecting business strategy data
      const businessStrategyDataTypes = [
        "organizationProblems", "userStrategy", "valueProposition", 
        "solutionStrategy", "managementStrategy", "businessOutcomes", 
        "costStructure", "peopleStrategy"
      ];
      
      // Special handling for the business strategy introduction message
      if (response.toLowerCase() === "okay" && currentQuestion === "businessStrategyIntro") {
        // Start with the first business strategy data type
        const token = Cookies.get("token");
        const { data } = await axios.get("/api/business-strategy", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (data.missingData && data.missingData.length > 0) {
          const firstMissingType = data.missingData[0];
          setCurrentQuestion(firstMissingType);
          startBusinessStrategyCollection(firstMissingType);
        }
        setLoading(false);
        return;
      }
      
      if (businessStrategyDataTypes.includes(currentQuestion)) {
        // Process business strategy data
        await processBusinessStrategyData(currentQuestion, response);
        setLoading(false);
        return;
      }
      
      // If the user is adding departments and types "done", move to the next data type
      if (currentQuestion === "departments" && response.toLowerCase() === "done" && dataRequirements.departments.length > 0) {
        const missingData = getMissingDataTypes(dataRequirements);
        if (missingData.length > 0 && missingData[0] !== "departments") {
          setCurrentQuestion(missingData[0]);
          
          let nextQuestion = "";
          switch (missingData[0]) {
            case "industry":
              nextQuestion = "What industry does your company operate in?";
              break;
            case "companySize":
              nextQuestion = "How many employees does your company have?";
              break;
            case "ceoName":
              nextQuestion = "Who is the CEO of your company?";
              break;
            case "ceoEmail":
              nextQuestion = "What is the email address of your CEO?";
              break;
            default:
              nextQuestion = "I need more information. Please provide details for: " + missingData[0];
          }
          
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: nextQuestion,
            },
          ]);
        } else {
          // All basic data has been collected, check if we need business strategy data
          try {
            const token = Cookies.get("token");
            const strategyResponse = await axios.get("/api/business-strategy", {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (strategyResponse.data.hasOrganizationData && 
                strategyResponse.data.missingData && 
                strategyResponse.data.missingData.length > 0) {
              // We need to collect business strategy data
              const firstMissingType = strategyResponse.data.missingData[0];
              setCurrentQuestion(firstMissingType);
              startBusinessStrategyCollection(firstMissingType);
            } else {
              // All data has been collected
              setDataCollectionMode(false);
              setMessages((prev) => [
                ...prev,
                {
                  from: "bot",
                  text: "Thank you for providing all the necessary information! Now I can better assist you with questions about your organization. What would you like to know?",
                },
              ]);
            }
          } catch (error) {
            console.error("Error checking business strategy data:", error);
            // All basic data has been collected
            setDataCollectionMode(false);
            setMessages((prev) => [
              ...prev,
              {
                from: "bot",
                text: "Thank you for providing all the necessary information! Now I can better assist you with questions about your organization. What would you like to know?",
              },
            ]);
          }
        }
      } else {
        // Process the collected data
        await processCollectedData(currentQuestion, response);
      }
      
      setLoading(false);
    } else {
      // Before allowing normal questions, check if business strategy data is complete
      try {
        const token = Cookies.get("token");
        
        // Check if we need to collect business strategy data first
        const strategyResponse = await axios.get("/api/business-strategy", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (strategyResponse.data.hasOrganizationData && 
            strategyResponse.data.missingData && 
            strategyResponse.data.missingData.length > 0) {
          // We need to collect business strategy data first
          setDataCollectionMode(true);
          const firstMissingType = strategyResponse.data.missingData[0];
          setCurrentQuestion(firstMissingType);
          
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: "Before I can answer your questions, I need some additional information about your business strategy.",
            },
          ]);
          
          startBusinessStrategyCollection(firstMissingType);
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
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: error.response?.data?.message || "Before I can answer your questions, I need more information about your business strategy.",
            },
          ]);
          
          // Start business strategy data collection with the first missing data type
          if (error.response?.data?.missingBusinessStrategyData.length > 0) {
            // Map the API's missing data types to our business strategy data collection fields
            const businessStrategyMapping = {
              "organizational problems": "organizationProblems",
              "user & organizational strategy": "userStrategy",
              "unique value proposition": "valueProposition",
              "solution & distribution strategy": "solutionStrategy",
              "management & systems strategy": "managementStrategy",
              "business outcomes": "businessOutcomes",
              "cost structure": "costStructure",
              "people strategy": "peopleStrategy"
            };
            
            const firstMissingType = error.response.data.missingBusinessStrategyData[0];
            const businessStrategyField = businessStrategyMapping[firstMissingType] || "organizationProblems";
            
            setCurrentQuestion(businessStrategyField);
            startBusinessStrategyCollection(businessStrategyField);
          }
        }
        // If the error indicates missing organization data, switch to organization data collection mode
        else if (error.response?.status === 404 && error.response?.data?.missingData) {
          setDataCollectionMode(true);
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: error.response?.data?.message || "I don't have enough information about your company yet. Let's set up your organization details first.",
            },
          ]);
          
          // Start the data collection process with the first missing data type
          if (error.response?.data?.missingDataTypes && error.response?.data?.missingDataTypes.length > 0) {
            // Map the API's missing data types to our data collection fields
            const dataTypeMapping = {
              "organization name": "organizationName",
              "industry": "industry",
              "CEO information": "ceoName",
              "departments": "departments"
            };
            
            const firstMissingType = error.response.data.missingDataTypes[0];
            const dataCollectionField = dataTypeMapping[firstMissingType] || "organizationName";
            
            startDataCollection(dataCollectionField);
          } else {
            // Default to organization name if no specific missing types are provided
            startDataCollection("organizationName");
          }
        } else {
          // Handle other errors
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: error.response?.data?.message || "Sorry, I couldn't process your request. Please try again.",
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
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
            placeholder={dataCollectionMode ? "Enter the requested information..." : "Ask a question about your company..."}
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