# Ollama Integration for Relve

This branch adds support for using Ollama as a local AI inference provider, allowing the application to run without API usage limits.

## What is Ollama?

Ollama is an open-source tool that lets you run large language models (LLMs) locally on your own computer. This provides several advantages:

- No API usage limits or costs
- Works offline without internet connection
- Complete privacy for sensitive business data
- Faster response times for many use cases

## Changes in this Branch

- Added configuration for switching between Hugging Face and Ollama
- Modified AI data collection API to support both providers
- Added fallback to Hugging Face if Ollama is not available
- Improved JSON parsing for different response formats
- Added documentation for Ollama setup
- Created a test script for verifying Ollama integration

## Setup Instructions

1. Install Ollama following the instructions in `docs/ollama-setup.md`
2. Pull the recommended model: `ollama pull llama2:7b-chat-q4_0`
3. Run the test script: `node test-ollama.js`
4. Start the application with Ollama as the provider: `AI_PROVIDER=ollama npm run dev`

## Configuration

The AI provider configuration is in `src/config/ai-providers.js`. You can switch between providers by:

1. Setting the `AI_PROVIDER` environment variable to either `'ollama'` or `'huggingface'`
2. Or by modifying the default in the configuration file

## Testing

A test script is included to verify that Ollama is working correctly:

```bash
node test-ollama.js
```

This script will:
1. Connect to the local Ollama server
2. Send a test prompt similar to what the application uses
3. Verify that the response is properly formatted JSON

## Fallback Mechanism

If Ollama is not available or fails to respond, the application will automatically fall back to using Hugging Face. This ensures that the application remains functional even if the local Ollama server is not running.

## Models

The default configuration uses the `llama2:7b-chat-q4_0` model, which is a good balance of performance and resource usage. You can change the model in the configuration file if you prefer a different model.

## Hardware Requirements

- **Minimum**: 8GB RAM, modern CPU
- **Recommended**: 16GB RAM
- **Storage**: ~4GB for the model

## Troubleshooting

If you encounter issues:

1. Make sure Ollama is running with `ollama serve`
2. Check if the model is downloaded with `ollama list`
3. Try a smaller model if you have memory constraints
4. Check the application logs for specific error messages