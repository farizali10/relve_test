/**
 * Test script for AI Provider Factory
 * 
 * This script tests the AI Provider Factory to ensure it correctly selects
 * and falls back between different AI providers.
 * 
 * Usage:
 * node test-provider-factory.js
 */

// Import the provider factory
const { AIProviderFactory } = require('./src/lib/ai-providers');

async function testProviderFactory() {
  console.log("Testing AI Provider Factory...");
  
  // Test explicit provider selection
  console.log("\n1. Testing explicit provider selection:");
  
  // Test Ollama provider
  try {
    const ollamaProvider = AIProviderFactory.getProvider({ provider: "ollama" });
    console.log(`✅ Successfully created ${ollamaProvider.constructor.name}`);
  } catch (error) {
    console.error(`❌ Failed to create Ollama provider: ${error.message}`);
  }
  
  // Test Hugging Face provider
  try {
    const hfProvider = AIProviderFactory.getProvider({ provider: "huggingface" });
    console.log(`✅ Successfully created ${hfProvider.constructor.name}`);
  } catch (error) {
    console.error(`❌ Failed to create Hugging Face provider: ${error.message}`);
  }
  
  // Test default provider
  try {
    const defaultProvider = AIProviderFactory.getProvider();
    console.log(`✅ Default provider is ${defaultProvider.constructor.name}`);
  } catch (error) {
    console.error(`❌ Failed to create default provider: ${error.message}`);
  }
  
  // Test best available provider
  console.log("\n2. Testing best available provider selection:");
  try {
    const bestProvider = await AIProviderFactory.getBestAvailableProvider();
    console.log(`✅ Best available provider is ${bestProvider.constructor.name}`);
    
    // If Ollama is available, this should be OllamaProvider
    // If not, it should fall back to HuggingFaceProvider
    if (bestProvider.constructor.name === "OllamaProvider") {
      console.log("   Ollama is available and was selected as the best provider");
    } else {
      console.log("   Ollama is not available, fell back to Hugging Face");
    }
  } catch (error) {
    console.error(`❌ Failed to get best available provider: ${error.message}`);
  }
  
  // Test with a simple prompt
  console.log("\n3. Testing provider with a simple prompt:");
  try {
    const provider = await AIProviderFactory.getBestAvailableProvider();
    console.log(`   Using ${provider.constructor.name} for test prompt`);
    
    const prompt = "Extract the company name from this text: 'My company is called Acme Corp'";
    console.log("   Sending prompt:", prompt);
    
    const response = await provider.generateResponse(prompt, { temperature: 0.1 });
    console.log("   Raw response:", response.substring(0, 100) + (response.length > 100 ? "..." : ""));
    
    const parsed = provider.parseResponse(response);
    console.log("   Parsed response:", JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error(`❌ Error testing provider with prompt: ${error.message}`);
  }
}

testProviderFactory();