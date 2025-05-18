/**
 * Test script for Ollama integration
 * 
 * This script tests the connection to Ollama and verifies that it can generate
 * structured JSON responses for our data extraction use case.
 * 
 * Usage:
 * node test-ollama.js
 */

const axios = require('axios');

async function testOllama() {
  try {
    console.log("Testing Ollama connection...");
    
    // Sample prompt similar to what we use in the application
    const prompt = `
You are an AI assistant helping to collect information about a company. You need to extract specific data points from the user's messages in a conversational, natural way.

USER MESSAGE:
My company name is Acme Corp and we're in the technology industry.

Your task is to extract any relevant information from the user's message and return it in JSON format.

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
`.trim();

    // System prompt to enforce JSON output
    const systemPrompt = "You are a helpful AI assistant that ONLY responds with valid JSON objects. Never include explanations, markdown, or code blocks in your responses.";
    
    // Format the prompt for Ollama
    const formattedPrompt = `<s>[INST] ${systemPrompt}\n\n${prompt} [/INST]`;
    
    console.log("Sending request to Ollama...");
    
    // Call Ollama API
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama2:7b-chat-q4_0",
        prompt: formattedPrompt,
        stream: false,
        options: {
          temperature: 0.5,
          top_p: 0.9
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("Received response from Ollama");
    
    // Get the raw response
    const output = response.data.response;
    console.log("\nRaw response:");
    console.log("=============");
    console.log(output);
    
    // Try to parse the JSON
    try {
      const parsedResponse = JSON.parse(output);
      console.log("\nParsed JSON:");
      console.log("============");
      console.log(JSON.stringify(parsedResponse, null, 2));
      
      // Validate the response structure
      if (parsedResponse.extractedData && 
          parsedResponse.nextQuestion && 
          parsedResponse.conversationalResponse) {
        console.log("\n✅ SUCCESS: Ollama returned a valid response with the expected structure");
      } else {
        console.log("\n⚠️ WARNING: Ollama response is missing some expected fields");
      }
    } catch (error) {
      console.error("\n❌ ERROR: Failed to parse Ollama response as JSON");
      console.error(error.message);
      
      // Try to extract JSON from the response
      const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
      const matches = output.match(jsonRegex);
      
      if (matches && matches.length > 0) {
        console.log("\nFound JSON-like structure in response:");
        console.log(matches[0]);
      }
    }
  } catch (error) {
    console.error("\n❌ ERROR: Failed to connect to Ollama");
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\nMake sure Ollama is running. You can start it with:");
      console.log("  ollama serve");
    }
  }
}

testOllama();