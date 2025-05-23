# ReeOrg - Organization Management with AI Assistant

This is a Next.js application for organization management with an integrated AI assistant powered by Llama. The AI assistant helps users understand their company structure and identify potential gaps that might prevent them from reaching their business goals.

## Features

- User authentication
- Organization management
- Department structure visualization
- AI Assistant for answering questions about the company

## Setup

1. Extract the downloaded zip file:
   ```
   unzip relve_test.zip
   cd relve_test
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_MONGO_URL=mongodb+srv://your-mongodb-connection-string
   JWT_SEC=your-jwt-secret
   HUGGINGFACE_API_KEY=your-huggingface-api-key
   ```

4. Run the development server:
   ```
   npm run dev
   ```
   
   For production deployment:
   ```
   npm run build
   npm start
   ```

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/app/api`: API routes for backend functionality
- `/src/app/api/ai-chat`: Llama integration endpoint
- `/src/components`: Reusable React components
- `/models`: MongoDB schema definitions

## AI Assistant Integration

The AI Assistant uses Meta's Llama 2 model (via Hugging Face) to answer questions about your organization based on the data stored in your MongoDB database. It can provide insights about:

- Organization structure
- Department details
- Business goals and challenges
- Company information

The system:
1. Retrieves organization and department data from MongoDB
2. Creates a context with this information
3. Sends the context along with the user's question to the Llama model via Hugging Face
4. Returns the AI-generated response

To use the AI Assistant:
1. Navigate to the AI Assistant page after logging in
2. Ask questions about your organization
3. The assistant will provide answers based on your organization's data

## Database Schema

The application uses MongoDB with the following main collections:
- Users: Authentication and user information
- Organization: Company details including industry, size, etc.
- Departments: Department structure and reporting relationships
- Chatbot: Organization chart with CEO and department heads

## Environment Variables

- `NEXT_PUBLIC_MONGO_URL`: Your MongoDB connection string
- `JWT_SEC`: Secret key for JWT authentication
- `HUGGINGFACE_API_KEY`: Your Hugging Face API key for accessing the Llama model

## Troubleshooting

- If you encounter CORS issues, check the `next.config.js` file for proper configuration
- For MongoDB connection issues, verify your connection string in the `.env.local` file
- If the AI assistant isn't working, ensure your Hugging Face API key is valid and has the necessary permissions to access the Llama model

## Model Configuration

The application is configured to use Meta's Llama 2 7B Chat model via Hugging Face. If you want to use a different Llama model:

1. Open `/src/app/api/ai-chat/route.js`
2. Find the model configuration (around line 112)
3. Change `model: "meta-llama/Llama-2-7b-chat-hf"` to your preferred model, such as:
   - `model: "meta-llama/Llama-2-13b-chat-hf"` (larger Llama 2 model)
   - `model: "meta-llama/Meta-Llama-3-8B-Instruct"` (newer Llama 3 model)
   - `model: "mistralai/Mistral-7B-Instruct-v0.2"` (alternative to Llama)

Note that to access Llama models on Hugging Face, you need to:
1. Create a Hugging Face account
2. Accept the model license on the Hugging Face model page
3. Generate an API key with read access
4. Add this key to your `.env.local` file
