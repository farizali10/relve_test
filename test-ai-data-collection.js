// Test script for the AI data collection API
const { AIProviderFactory } = require('./src/lib/ai-providers');

async function testAIDataCollection() {
  try {
    console.log("Testing AI data collection with providers...");
    
    // Sample user messages and contexts to test
    const testCases = [
      {
        userMessage: "Hello, I'm setting up my company profile",
        currentQuestion: null,
        collectedData: {}
      },
      {
        userMessage: "My company is called Acme Corporation",
        currentQuestion: "organizationName",
        collectedData: {}
      },
      {
        userMessage: "We're in the technology industry",
        currentQuestion: "industry",
        collectedData: { organizationName: "Acme Corporation" }
      }
    ];
    
    // Get the best available provider
    const provider = await AIProviderFactory.getBestAvailableProvider();
    console.log("Using provider:", provider.constructor.name);
    
    // Test each case
    for (const testCase of testCases) {
      console.log("\nTesting with message:", testCase.userMessage);
      console.log("Current question:", testCase.currentQuestion);
      
      try {
        // Create a prompt similar to the one in the API
        const context = {
          missingOrgData: ["organizationName", "industry", "companySize", "ceoName", "ceoEmail", "departments"],
          missingBusinessStrategyData: ["organizationProblems", "userStrategy", "valueProposition"],
          currentQuestion: testCase.currentQuestion,
          collectedData: testCase.collectedData,
          existingData: {}
        };
        
        const prompt = `
You are an AI assistant helping to collect information about a company. You need to extract specific data points from the user's messages in a conversational, natural way.

CONTEXT:
${JSON.stringify(context, null, 2)}

CURRENT TASK:
${testCase.currentQuestion ? `You are currently collecting data for: ${testCase.currentQuestion}` : "You need to determine what data to collect next."}

USER MESSAGE:
${testCase.userMessage}

Your task is to:
1. Extract any relevant information from the user's message that corresponds to the data we're collecting
2. Determine what data to collect next
3. Respond in a natural, conversational way
4. If the user's message doesn't contain the information you need, ask for it specifically
5. If the user seems confused or asks for help, explain what information you need and why

Return your response in the following JSON format:
{
  "extractedData": {
    "dataType": "the type of data extracted (e.g., organizationName, industry, etc.)",
    "value": "the extracted value"
  },
  "nextQuestion": {
    "dataType": "the type of data to collect next",
    "question": "the question to ask the user"
  },
  "conversationalResponse": "Your natural language response to the user"
}
`;
        
        // Generate a response from the provider
        const response = await provider.getResponse(prompt);
        console.log("Provider response:", JSON.stringify(response, null, 2));
      } catch (error) {
        console.error("Error in AI data collection:", error.message);
      }
    }
    
    console.log("\nAI data collection test completed!");
  } catch (error) {
    console.error("Error testing AI data collection:", error.message);
  }
}

testAIDataCollection();