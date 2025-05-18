/**
 * Configuration for AI providers
 * This file allows switching between different AI providers (Ollama, Hugging Face, etc.)
 */

export const AI_PROVIDER = {
  // Set the default provider - can be overridden with environment variable
  type: process.env.AI_PROVIDER || 'ollama', // 'ollama' or 'huggingface'
  
  // API endpoints for different providers
  endpoints: {
    ollama: 'http://localhost:11434/api/generate',
    huggingface: 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct'
  },
  
  // Model names/identifiers for different providers
  models: {
    ollama: 'llama2:7b-chat-q4_0',
    huggingface: 'meta-llama/Llama-3.1-8B-Instruct'
  },
  
  // Provider-specific parameters
  parameters: {
    ollama: {
      temperature: 0.5,
      top_p: 0.9,
      top_k: 40,
      num_predict: 800
    },
    huggingface: {
      max_new_tokens: 800,
      temperature: 0.5,
      return_full_text: false,
      do_sample: true,
      top_p: 0.9
    }
  },
  
  // Format templates for different providers
  templates: {
    ollama: {
      system: "<s>[INST] {system} ",
      user: "\n\n{user} [/INST]",
      assistant: ""
    },
    huggingface: {
      system: "<|system|>\n{system}\n<|user|>\n{user}\n<|assistant|>",
      user: "",
      assistant: ""
    }
  }
};