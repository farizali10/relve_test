import { HuggingFaceProvider } from "./huggingface-provider";
import { OllamaProvider } from "./ollama-provider";

/**
 * AI Provider Factory
 * Creates and returns the appropriate AI provider based on configuration
 */
export class AIProviderFactory {
  /**
   * Get the appropriate AI provider based on configuration
   * @param {Object} options - Options for the provider
   * @returns {BaseAIProvider} - The AI provider instance
   */
  static getProvider(options = {}) {
    // Determine which provider to use
    const providerType = options.provider || process.env.AI_PROVIDER || "huggingface";
    
    switch (providerType.toLowerCase()) {
      case "ollama":
        return new OllamaProvider(options);
      
      case "huggingface":
      default:
        return new HuggingFaceProvider(options);
    }
  }

  /**
   * Get the best available provider
   * This will try Ollama first, and fall back to Hugging Face if Ollama is not available
   * @param {Object} options - Options for the provider
   * @returns {Promise<BaseAIProvider>} - The best available AI provider
   */
  static async getBestAvailableProvider(options = {}) {
    // If the provider is explicitly specified, use that
    if (options.provider || process.env.AI_PROVIDER) {
      return this.getProvider(options);
    }
    
    // Try Ollama first
    try {
      const ollamaProvider = new OllamaProvider(options);
      
      // Test if Ollama is available
      await fetch(`${options.endpoint || "http://localhost:11434"}/api/version`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      // If we get here, Ollama is available
      console.log("Using Ollama provider");
      return ollamaProvider;
    } catch (error) {
      // Ollama is not available, fall back to Hugging Face
      console.log("Ollama not available, falling back to Hugging Face");
      return new HuggingFaceProvider(options);
    }
  }
}