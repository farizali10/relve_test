# Ollama Setup Guide

This guide explains how to set up Ollama for local AI inference with the Relve application.

## Why Ollama?

Ollama provides a way to run powerful AI models locally without API usage limits or costs. This is particularly useful for:
- Development and testing without API rate limits
- Environments where internet access is limited
- Situations where data privacy is a concern

## Installation

### Windows

1. Download the installer from [Ollama.com](https://ollama.com/download/windows)
2. Run the installer and follow the prompts
3. After installation, Ollama will run as a Windows service

### macOS

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Downloading Models

After installing Ollama, you need to download the model:

```bash
# Open Command Prompt or Terminal
ollama pull llama2:7b-chat-q4_0
```

This will download the Llama 2 7B model with 4-bit quantization, which is optimized for systems with limited RAM.

## Hardware Requirements

- **Minimum**: 8GB RAM, modern CPU
- **Recommended**: 16GB RAM
- **Storage**: ~4GB for the model

## Verifying Installation

To verify that Ollama is working correctly:

```bash
ollama run llama2:7b-chat-q4_0 "Return a JSON object with a greeting message"
```

You should see a JSON response like:
```json
{
  "greeting": "Hello there! How are you today?"
}
```

## Configuring the Application

The application is configured to use Ollama by default in the `ollama-integration` branch. You can switch between Ollama and Hugging Face by:

1. Setting the `AI_PROVIDER` environment variable to either `'ollama'` or `'huggingface'`
2. Or by modifying the default in `src/config/ai-providers.js`

## Troubleshooting

### Memory Issues

If you see an error like:
```
Error: model requires more system memory (8.4 GiB) than is available (7.4 GiB)
```

Try these solutions:
1. Close other applications to free up memory
2. Use a smaller model like `phi2` or `tinyllama`
3. Restart your computer to clear memory

### Connection Issues

If the application can't connect to Ollama:
1. Make sure Ollama is running (`ollama serve` in Command Prompt)
2. Check if any firewall is blocking localhost connections
3. Verify that the Ollama service is running

## Production Considerations

For production environments:
1. Set up Ollama as a service that starts automatically
2. Consider using a dedicated server for Ollama if handling multiple requests
3. Implement proper error handling for cases where Ollama might not be available

## Alternative Models

If the recommended model doesn't work well for your system, try these alternatives:

- `phi2` - Smaller, faster model from Microsoft
- `mistral:7b-instruct-q4_0` - Alternative 7B model with good instruction following
- `tinyllama` - Very small model for systems with limited resources