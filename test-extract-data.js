// Test script for the extract-data API
const { AIProviderFactory } = require('./src/lib/ai-providers');
const { extractData } = require('./src/lib/langgraph/dataExtractor');

async function testExtractData() {
  try {
    console.log("Testing data extraction with AI providers...");
    
    // Sample user messages to test
    const testMessages = [
      "My company name is Acme Corporation",
      "We're in the technology industry with about 500 employees",
      "Our CEO is John Smith and his email is john@acme.com",
      "We have a marketing department led by Jane Doe who is the Marketing Director and reports to the CEO"
    ];
    
    // Get the best available provider
    const provider = await AIProviderFactory.getBestAvailableProvider();
    console.log("Using provider:", provider.constructor.name);
    
    // Test each message
    for (const message of testMessages) {
      console.log("\nTesting extraction with message:", message);
      
      try {
        // Generate a response directly from the provider
        const prompt = `
Extract any relevant company information from this message: "${message}"
Return a JSON object with the extracted data.
`;
        
        const rawResponse = await provider.generateResponse(prompt);
        console.log("Raw provider response:", rawResponse);
        
        const parsedResponse = provider.parseResponse(rawResponse);
        console.log("Parsed response:", JSON.stringify(parsedResponse, null, 2));
        
        // Test the dataExtractor
        const extractionResult = await extractData(message, "all");
        console.log("Data extractor result:", JSON.stringify(extractionResult, null, 2));
      } catch (error) {
        console.error("Error extracting data:", error.message);
      }
    }
    
    console.log("\nData extraction test completed!");
  } catch (error) {
    console.error("Error testing data extraction:", error.message);
  }
}

testExtractData();