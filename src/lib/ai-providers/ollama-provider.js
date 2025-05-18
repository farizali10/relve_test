import { BaseAIProvider } from "./base-provider";

/**
 * Ollama AI Provider
 * Implements the BaseAIProvider interface for locally hosted Ollama models
 */
export class OllamaProvider extends BaseAIProvider {
  constructor(options = {}) {
    super();
    this.endpoint = options.endpoint || "http://localhost:11434";
    this.model = options.model || "llama2:7b-chat-q4_0";
    this.systemPrompt = options.systemPrompt || "You are a helpful AI assistant that ONLY responds with valid JSON objects. Never include explanations, markdown, or code blocks in your responses.";
  }

  /**
   * Generate a response from the Ollama model
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the model
   * @returns {Promise<string>} - The raw response from the model
   */
  async generateResponse(prompt, options = {}) {
    try {
      // Format the prompt based on the model
      let formattedPrompt;
      if (this.model.includes("llama2")) {
        formattedPrompt = `<s>[INST] ${prompt} [/INST]`;
      } else if (this.model.includes("mistral")) {
        formattedPrompt = `<|system|>\n${this.systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>`;
      } else if (this.model.includes("phi")) {
        formattedPrompt = `<|system|>\n${this.systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>`;
      } else {
        // Default format
        formattedPrompt = `System: ${this.systemPrompt}\nUser: ${prompt}\nAssistant:`;
      }

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          prompt: formattedPrompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.5,
            top_p: options.topP || 0.9,
            top_k: options.topK || 40,
            num_predict: options.maxTokens || 1024
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Ollama API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Ollama API Error:", error.message);
      
      // If Ollama is not available, throw a specific error
      if (error.message.includes("ECONNREFUSED") || error.message.includes("Failed to fetch")) {
        throw new Error("Ollama service is not available. Make sure Ollama is running.");
      }
      
      throw error;
    }
  }

  /**
   * Parse the raw AI response into a structured format
   * @param {string} output - The raw response from the model
   * @returns {Object} - The parsed response
   */
  parseResponse(output) {
    try {
      // Try to extract and parse JSON from the response
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
          .replace(/\\n/g, " ")
          .replace(/\\"/g, '"')
          .replace(/\\t/g, " ");
        
        try {
          return JSON.parse(jsonString);
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
          
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
            return this.getFallbackResponse();
          }
        }
      } else {
        return this.getFallbackResponse();
      }
    } catch (error) {
      console.error("Error parsing Ollama response:", error);
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