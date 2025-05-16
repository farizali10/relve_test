import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export async function GET(request) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Check if API key exists
    if (!apiKey) {
      return NextResponse.json({ 
        status: "error", 
        message: "Hugging Face API key is not configured",
        apiKeyExists: false
      }, { status: 400 });
    }
    
    // Initialize Hugging Face client
    const hf = new HfInference(apiKey);
    
    // Try to access a simple model that doesn't require special permissions
    // This will verify if the API key is valid
    try {
      const response = await hf.textGeneration({
        model: "gpt2",  // Simple model that doesn't require special permissions
        inputs: "Hello, I'm a language model",
        parameters: {
          max_new_tokens: 20,
          temperature: 0.7,
        }
      });
      
      return NextResponse.json({
        status: "success",
        message: "API key is valid and working",
        apiKeyExists: true,
        apiKeyValid: true,
        response: response.generated_text
      });
    } catch (modelError) {
      // API key might be invalid or expired
      return NextResponse.json({
        status: "error",
        message: "API key exists but may be invalid or expired",
        apiKeyExists: true,
        apiKeyValid: false,
        error: modelError.message
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      message: "Error testing API connection", 
      error: error.message 
    }, { status: 500 });
  }
}

// Also test Llama model access specifically
export async function POST(request) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Check if API key exists
    if (!apiKey) {
      return NextResponse.json({ 
        status: "error", 
        message: "Hugging Face API key is not configured",
        apiKeyExists: false
      }, { status: 400 });
    }
    
    // Initialize Hugging Face client
    const hf = new HfInference(apiKey);
    
    // Try to access the Llama model specifically
    try {
      const response = await hf.textGeneration({
        model: "meta-llama/Llama-2-7b-chat-hf",
        inputs: "<s>[INST] Hello, I'm testing if I can access this model [/INST]",
        parameters: {
          max_new_tokens: 20,
          temperature: 0.7,
        }
      });
      
      return NextResponse.json({
        status: "success",
        message: "Llama model access is working",
        llamaAccessValid: true,
        response: response.generated_text
      });
    } catch (modelError) {
      // Check if it's a model access issue
      const errorMsg = modelError.message.toLowerCase();
      const isAccessIssue = 
        errorMsg.includes("unauthorized") || 
        errorMsg.includes("permission") || 
        errorMsg.includes("access") ||
        errorMsg.includes("not allowed");
      
      return NextResponse.json({
        status: "error",
        message: isAccessIssue 
          ? "You don't have access to the Llama model. Make sure you've accepted the model license on Hugging Face."
          : "Error accessing Llama model",
        llamaAccessValid: false,
        isAccessIssue,
        error: modelError.message
      }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      message: "Error testing Llama model access", 
      error: error.message 
    }, { status: 500 });
  }
}