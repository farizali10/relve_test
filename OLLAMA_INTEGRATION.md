# Ollama Integration for Relve

This branch adds support for using locally hosted Ollama models as an alternative to Hugging Face for AI-powered data collection and extraction.

## Benefits

- **No Usage Limits**: Run AI models locally without API rate limits or quotas
- **Privacy**: All data stays on your local machine
- **Cost Efficiency**: No ongoing API costs
- **Flexibility**: Switch between Ollama and Hugging Face as needed

## Setup Instructions

### 1. Install Ollama

#### Windows:
- Download and install from [Ollama.com](https://ollama.com/download/windows)
- Run the installer and follow the prompts

#### macOS:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Download a Model

For optimal performance on systems with 16GB RAM:

```bash
ollama pull llama2:7b-chat-q4_0
```

For systems with less RAM:

```bash
ollama pull phi2
```

### 3. Start Ollama

Make sure Ollama is running:

```bash
ollama serve
```

### 4. Configure the Application

Create a `.env.local` file based on the provided `.env.local.example`:

```
AI_PROVIDER=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama2:7b-chat-q4_0
```

### 5. Test the Integration

Run the test script to verify Ollama is working:

```bash
node test-ollama.js
```

## Configuration Options

The application can be configured to use different AI providers:

- `AI_PROVIDER=ollama` - Use locally hosted Ollama models
- `AI_PROVIDER=huggingface` - Use Hugging Face API
- Leave `AI_PROVIDER` unset to automatically use the best available provider (tries Ollama first, falls back to Hugging Face)

## Troubleshooting

### Ollama Not Available

If Ollama is not running or not accessible, the application will automatically fall back to using Hugging Face.

### Memory Issues

If you encounter memory issues with Ollama:

1. Try a smaller model like `phi2` or `orca-mini`
2. Close other applications to free up memory
3. Restart your computer to clear memory

### JSON Parsing Issues

If the model has trouble generating valid JSON:

1. Try a different model
2. Adjust the temperature setting (lower values like 0.3 produce more consistent outputs)
3. Check the system prompt to ensure it emphasizes JSON output

## Architecture

The integration uses a provider pattern:

- `BaseAIProvider` - Abstract interface for AI providers
- `HuggingFaceProvider` - Implementation for Hugging Face API
- `OllamaProvider` - Implementation for locally hosted Ollama models
- `AIProviderFactory` - Factory to create the appropriate provider

This architecture allows for easy switching between providers and adding new providers in the future.