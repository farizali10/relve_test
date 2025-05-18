# Ollama Integration Pull Request

## Overview

This PR adds support for using locally hosted Ollama models as an alternative to Hugging Face for AI-powered data collection and extraction. This provides several benefits:

- **No Usage Limits**: Run AI models locally without API rate limits or quotas
- **Privacy**: All data stays on your local machine
- **Cost Efficiency**: No ongoing API costs
- **Flexibility**: Switch between Ollama and Hugging Face as needed

## Changes

### New Components

- **AI Provider Interface**: Created a flexible provider pattern for AI services
  - `BaseAIProvider`: Abstract interface for AI providers
  - `HuggingFaceProvider`: Implementation for Hugging Face API
  - `OllamaProvider`: Implementation for locally hosted Ollama models
  - `AIProviderFactory`: Factory to create the appropriate provider

- **User Interface**:
  - Added an AI Provider Configuration component to the chat interface
  - Created a settings panel for switching between providers
  - Added status indicators for provider availability

- **API Endpoints**:
  - `/api/check-hf-status`: Checks Hugging Face API status
  - `/api/user-preferences`: Saves user provider preferences

### Modified Components

- **Data Extraction API**: Updated to use the provider interface
- **AI Data Collection API**: Modified to use the user's preferred provider
- **User Model**: Added preferences field for storing provider preference

### Documentation

- Added comprehensive documentation for Ollama setup and usage
- Created test scripts for verifying the integration

## Testing

The integration has been tested with:
- Ollama running locally with the llama2:7b-chat-q4_0 model
- Hugging Face API with the Llama-3.1-8B-Instruct model
- Automatic fallback from Ollama to Hugging Face when Ollama is unavailable

## How to Test

1. Install Ollama following the instructions in OLLAMA_INTEGRATION.md
2. Pull the recommended model: `ollama pull llama2:7b-chat-q4_0`
3. Start Ollama: `ollama serve`
4. Run the application and navigate to the AI Chat page
5. Use the settings panel to switch between providers

## Screenshots

[Screenshots would be added here in a real PR]