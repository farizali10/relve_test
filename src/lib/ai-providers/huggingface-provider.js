import axios from "axios";
import { BaseAIProvider } from "./base-provider";

/**
 * Hugging Face AI Provider
 * Implements the BaseAIProvider interface for Hugging Face models
 */
export class HuggingFaceProvider extends BaseAIProvider {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || process.env.HUGGINGFACE_API_KEY;
    this.model = options.model || "meta-llama/Llama-3.1-8B-Instruct";
    this.systemPrompt = options.systemPrompt || "You are a helpful AI assistant that ONLY responds with valid JSON objects. Never include explanations, markdown, or code blocks in your responses.";
  }

  /**
   * Generate a response from the Hugging Face model
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the model
   * @returns {Promise<string>} - The raw response from the model
   */
  async generateResponse(prompt, options = {}) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.model}`,
        {
          inputs: `<|system|>\n${this.systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>`,
          parameters: {
            max_new_tokens: options.maxTokens || 800,
            temperature: options.temperature || 0.5,
            return_full_text: false,
            do_sample: true,
            top_p: options.topP || 0.9
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Extract the raw response text
      let output = "";
      if (Array.isArray(response.data)) {
        output = response.data[0]?.generated_text?.trim() || "{}";
      } else if (typeof response.data === 'object' && response.data.generated_text) {
        output = response.data.generated_text.trim();
      } else if (typeof response.data === 'string') {
        output = response.data.trim();
      } else {
        output = JSON.stringify(response.data);
      }

      return output;
    } catch (error) {
      console.error("HuggingFace API Error:", error.message);
      throw new Error(`HuggingFace API Error: ${error.message}`);
    }
  }

  /**
   * Parse the raw AI response into a structured format
   * @param {string} output - The raw response from the model
   * @returns {Object} - The parsed response
   */
  parseResponse(output) {
    try {
      // More robust JSON extraction
      if (typeof output === 'object' && !Array.isArray(output)) {
        // If it's already a valid object, use it directly
        return output;
      } else {
        // Extract JSON from the response text
        // First, try to find JSON between curly braces
        let jsonString = "";
        let jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
        let matches = output.match(jsonRegex);
        
        if (matches && matches.length > 0) {
          // Find the largest match which is likely the complete JSON
          jsonString = matches.reduce((a, b) => a.length > b.length ? a : b);
          
          // Clean the JSON string
          jsonString = jsonString
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
            .replace(/\\n/g, " ")                         // Replace newlines with spaces
            .replace(/\\"/g, '"')                         // Fix escaped quotes
            .replace(/\\t/g, " ")                         // Replace tabs with spaces
            .replace(/\\/g, "\\\\");                      // Escape backslashes
            
          try {
            return JSON.parse(jsonString);
          } catch (innerError) {
            console.error("Failed to parse extracted JSON:", innerError);
            
            // Try to fix common JSON issues
            try {
              // Replace Python-style single quotes with double quotes
              const fixedJson = jsonString
                .replace(/'/g, '"')
                .replace(/None/g, 'null')
                .replace(/True/g, 'true')
                .replace(/False/g, 'false');
              
              return JSON.parse(fixedJson);
            } catch (fixError) {
              // Fallback to a default response
              return this.getFallbackResponse();
            }
          }
        } else {
          // If no JSON object found, create a default response
          return this.getFallbackResponse();
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return this.getFallbackResponse();
    }
  }

  /**
   * Get a fallback response when parsing fails
   * @returns {Object} - The fallback response
   */
  getFallbackResponse() {
    return {
      extractedData: null,
      nextQuestion: {
        dataType: "retry",
        question: "I'm having trouble understanding. Could you please provide the information again?"
      },
      conversationalResponse: "I'm having trouble processing your request. Please try again."
    };
  }
}