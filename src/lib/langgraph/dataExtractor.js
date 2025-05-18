/**
 * Data Extraction Graph using LangGraph concepts
 * 
 * This module implements a simple state machine for extracting structured data
 * from natural language responses using AI.
 */

import axios from 'axios';

// State definition
const createInitialState = (dataType, userResponse, token) => ({
  dataType,
  userResponse,
  token,
  extractedData: null,
  attempts: 0,
  maxAttempts: 3,
  error: null,
  complete: false
});

// Nodes (functions that process the state)
const nodes = {
  // Extract data using AI
  extractData: async (state) => {
    try {
      console.log(`Attempting AI extraction for ${state.dataType}...`);
      
      // Call the AI extraction endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/extract-data`,
        { 
          dataType: state.dataType, 
          userResponse: state.userResponse 
        },
        {
          headers: { 
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      return {
        ...state,
        extractedData: response.data.extractedData,
        attempts: state.attempts + 1
      };
    } catch (error) {
      console.error("Error in AI extraction:", error);
      return {
        ...state,
        error: error.message,
        attempts: state.attempts + 1
      };
    }
  },
  
  // Validate the extracted data
  validateData: (state) => {
    console.log(`Validating extracted data for ${state.dataType}:`, state.extractedData);
    
    // Check if we have any data
    if (!state.extractedData) {
      return {
        ...state,
        error: "No data was extracted"
      };
    }
    
    // Validate based on data type
    let isValid = false;
    let validationError = null;
    
    switch (state.dataType) {
      case "organizationProblems":
        isValid = Array.isArray(state.extractedData) && state.extractedData.length > 0;
        validationError = isValid ? null : "Could not extract organizational problems";
        break;
        
      case "userStrategy":
        isValid = typeof state.extractedData === 'object' && 
                 state.extractedData.targetSegments && 
                 state.extractedData.growthPlans;
        validationError = isValid ? null : "Could not extract target segments and growth plans";
        break;
        
      case "valueProposition":
        isValid = typeof state.extractedData === 'string' && state.extractedData.length > 0;
        validationError = isValid ? null : "Could not extract value proposition";
        break;
        
      case "solutionStrategy":
        isValid = typeof state.extractedData === 'object' && 
                 state.extractedData.solution && 
                 state.extractedData.distributionStrategy;
        validationError = isValid ? null : "Could not extract solution and distribution strategy";
        break;
        
      case "managementStrategy":
        isValid = typeof state.extractedData === 'string' && state.extractedData.length > 0;
        validationError = isValid ? null : "Could not extract management strategy";
        break;
        
      case "businessOutcomes":
        isValid = typeof state.extractedData === 'object' && 
                 state.extractedData.revenueTargets && 
                 state.extractedData.timeToHire && 
                 state.extractedData.retentionGoals;
        validationError = isValid ? null : "Could not extract business outcomes";
        break;
        
      case "costStructure":
        isValid = typeof state.extractedData === 'object' && 
                 state.extractedData.budgetPerDepartment && 
                 state.extractedData.headcountCaps;
        validationError = isValid ? null : "Could not extract cost structure";
        break;
        
      case "peopleStrategy":
        isValid = typeof state.extractedData === 'object' && 
                 state.extractedData.criticalRoles && 
                 state.extractedData.skillPriorities && 
                 state.extractedData.benchStrength;
        validationError = isValid ? null : "Could not extract people strategy";
        break;
        
      default:
        isValid = false;
        validationError = "Unknown data type";
    }
    
    return {
      ...state,
      error: validationError,
      complete: isValid
    };
  },
  
  // Fallback to simpler extraction if AI fails
  fallbackExtraction: (state) => {
    console.log(`Using fallback extraction for ${state.dataType}...`);
    
    let extractedData;
    const userResponse = state.userResponse;
    
    // Simple fallback extraction logic
    switch (state.dataType) {
      case "organizationProblems":
        // Split by periods, commas, or newlines and filter out empty strings
        extractedData = userResponse
          .split(/[.,\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 3); // Take up to 3 items
        break;
        
      case "userStrategy":
        // First half is target segments, second half is growth plans
        const halfPoint = Math.floor(userResponse.length / 2);
        extractedData = {
          targetSegments: userResponse.substring(0, halfPoint).trim(),
          growthPlans: userResponse.substring(halfPoint).trim()
        };
        break;
        
      case "valueProposition":
        extractedData = userResponse;
        break;
        
      case "solutionStrategy":
        // First half is solution, second half is distribution
        const solutionHalfPoint = Math.floor(userResponse.length / 2);
        extractedData = {
          solution: userResponse.substring(0, solutionHalfPoint).trim(),
          distributionStrategy: userResponse.substring(solutionHalfPoint).trim()
        };
        break;
        
      case "managementStrategy":
        extractedData = userResponse;
        break;
        
      case "businessOutcomes":
        // Split by periods, commas, or newlines
        const outcomeParts = userResponse
          .split(/[.,\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
          
        extractedData = {
          revenueTargets: outcomeParts[0] || userResponse,
          timeToHire: outcomeParts[1] || outcomeParts[0] || userResponse,
          retentionGoals: outcomeParts[2] || outcomeParts[0] || userResponse
        };
        break;
        
      case "costStructure":
        // Split by periods, commas, or newlines
        const costParts = userResponse
          .split(/[.,\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
          
        extractedData = {
          budgetPerDepartment: costParts[0] || userResponse,
          headcountCaps: costParts[1] || costParts[0] || userResponse
        };
        break;
        
      case "peopleStrategy":
        // Split by periods, commas, or newlines
        const peopleParts = userResponse
          .split(/[.,\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
          
        extractedData = {
          criticalRoles: peopleParts[0] || userResponse,
          skillPriorities: peopleParts[1] || peopleParts[0] || userResponse,
          benchStrength: peopleParts[2] || peopleParts[0] || userResponse
        };
        break;
        
      default:
        extractedData = userResponse;
    }
    
    return {
      ...state,
      extractedData,
      complete: true
    };
  }
};

// Edge definitions (determine the next node to execute)
const getNextNode = (state) => {
  if (state.complete) {
    return "end";
  }
  
  if (state.error) {
    if (state.attempts >= state.maxAttempts) {
      return "fallbackExtraction";
    } else {
      return "extractData";
    }
  }
  
  return "validateData";
};

// Execute the graph
export async function extractDataWithGraph(dataType, userResponse, token) {
  let state = createInitialState(dataType, userResponse, token);
  
  // Initial extraction
  state = await nodes.extractData(state);
  
  // Continue processing until complete
  while (!state.complete) {
    const nextNode = getNextNode(state);
    
    if (nextNode === "end") {
      break;
    }
    
    state = await nodes[nextNode](state);
  }
  
  return state.extractedData;
}

// Export the graph components for testing and debugging
export const dataExtractionGraph = {
  nodes,
  getNextNode,
  createInitialState
};