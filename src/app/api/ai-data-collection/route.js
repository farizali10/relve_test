import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";
import { BusinessStrategy } from "../../../../models/BusinessStrategy";
import { AI_PROVIDER } from "@/config/ai-providers";

export async function POST(request) {
  try {
    await connectDb();

    // Authenticate user
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    // Parse user input and context
    const { userMessage, currentQuestion, collectedData } = await request.json();

    // Get existing data
    const chatbot = await Chatbot.findOne({ user: userId });
    const organization = await Organization.findOne({ user: userId });
    const departments = await Department.find({ user: userId });
    const businessStrategy = await BusinessStrategy.findOne({ user: userId });

    // Determine what data we're collecting and what's missing
    const missingOrgData = [];
    if (!chatbot?.organizationName) missingOrgData.push("organizationName");
    if (!organization?.industry) missingOrgData.push("industry");
    if (!organization?.companySize) missingOrgData.push("companySize");
    if (!chatbot?.ceoName) missingOrgData.push("ceoName");
    if (!chatbot?.ceoEmail) missingOrgData.push("ceoEmail");
    if (!departments || departments.length === 0) missingOrgData.push("departments");

    // Check business strategy data
    const missingBusinessStrategyData = [];
    if (!businessStrategy || !businessStrategy.organizationProblems || businessStrategy.organizationProblems.length === 0) {
      missingBusinessStrategyData.push("organizationProblems");
    }
    if (!businessStrategy || !businessStrategy.userStrategy || !businessStrategy.userStrategy.targetSegments || !businessStrategy.userStrategy.growthPlans) {
      missingBusinessStrategyData.push("userStrategy");
    }
    if (!businessStrategy || !businessStrategy.valueProposition) {
      missingBusinessStrategyData.push("valueProposition");
    }
    if (!businessStrategy || !businessStrategy.solutionStrategy || !businessStrategy.solutionStrategy.solution || !businessStrategy.solutionStrategy.distributionStrategy) {
      missingBusinessStrategyData.push("solutionStrategy");
    }
    if (!businessStrategy || !businessStrategy.managementStrategy) {
      missingBusinessStrategyData.push("managementStrategy");
    }
    if (!businessStrategy || !businessStrategy.businessOutcomes || !businessStrategy.businessOutcomes.revenueTargets || !businessStrategy.businessOutcomes.timeToHire || !businessStrategy.businessOutcomes.retentionGoals) {
      missingBusinessStrategyData.push("businessOutcomes");
    }
    if (!businessStrategy || !businessStrategy.costStructure || !businessStrategy.costStructure.budgetPerDepartment || !businessStrategy.costStructure.headcountCaps) {
      missingBusinessStrategyData.push("costStructure");
    }
    if (!businessStrategy || !businessStrategy.peopleStrategy || !businessStrategy.peopleStrategy.criticalRoles || !businessStrategy.peopleStrategy.skillPriorities || !businessStrategy.peopleStrategy.benchStrength) {
      missingBusinessStrategyData.push("peopleStrategy");
    }

    // Build context for the AI
    const context = {
      missingOrgData,
      missingBusinessStrategyData,
      currentQuestion,
      collectedData,
      existingData: {
        organizationName: chatbot?.organizationName || "",
        industry: organization?.industry || "",
        companySize: organization?.companySize || "",
        ceoName: chatbot?.ceoName || "",
        ceoEmail: chatbot?.ceoEmail || "",
        departments: departments || []
      }
    };

    // Create prompt for the AI
    const prompt = `
You are an AI assistant helping to collect information about a company. You need to extract specific data points from the user's messages in a conversational, natural way.

CONTEXT:
${JSON.stringify(context, null, 2)}

CURRENT TASK:
${currentQuestion ? `You are currently collecting data for: ${currentQuestion}` : "You need to determine what data to collect next."}

USER MESSAGE:
${userMessage}

Your task is to:
1. Extract any relevant information from the user's message that corresponds to the data we're collecting
2. Determine what data to collect next
3. Respond in a natural, conversational way
4. If the user's message doesn't contain the information you need, ask for it specifically
5. If the user seems confused or asks for help, explain what information you need and why

IMPORTANT: You must ONLY return a valid JSON object with no additional text, code, or explanation before or after it.
Do not include any markdown code blocks, Python code, or any other text outside the JSON object.

Return your response in the following JSON format:
{
  "extractedData": {
    "dataType": "the type of data extracted (e.g., organizationName, industry, etc.)",
    "value": "the extracted value"
  },
  "nextQuestion": {
    "dataType": "the type of data to collect next",
    "question": "the question to ask the user"
  },
  "conversationalResponse": "Your natural language response to the user"
}

If you can't extract any data, set extractedData to null.
If you've collected all the data, set nextQuestion to null.

Remember: Return ONLY the JSON object with no additional text, code, or explanation.
`.trim();

    // Add a system message to enforce JSON output
    const systemPrompt = "You are a helpful AI assistant that ONLY responds with valid JSON objects. Never include explanations, markdown, or code blocks in your responses.";
    
    // Get the current AI provider configuration
    const provider = AI_PROVIDER.type;
    console.log(`Using AI provider: ${provider}`);
    
    let response;
    
    try {
      if (provider === 'ollama') {
        // Format the prompt for Ollama
        const formattedPrompt = AI_PROVIDER.templates.ollama.system.replace('{system}', systemPrompt) + 
                               AI_PROVIDER.templates.ollama.user.replace('{user}', prompt);
        
        // Call Ollama API
        response = await axios.post(
          AI_PROVIDER.endpoints.ollama,
          {
            model: AI_PROVIDER.models.ollama,
            prompt: formattedPrompt,
            stream: false,
            options: AI_PROVIDER.parameters.ollama
          },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        // Default to Hugging Face
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        // Format the prompt for Hugging Face
        const formattedPrompt = AI_PROVIDER.templates.huggingface.system.replace('{system}', systemPrompt)
                                                                      .replace('{user}', prompt);
        
        // Call Hugging Face API
        response = await axios.post(
          AI_PROVIDER.endpoints.huggingface,
          {
            inputs: formattedPrompt,
            parameters: AI_PROVIDER.parameters.huggingface
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          }
        );
      }
    } catch (apiError) {
      console.error(`Error calling ${provider} API:`, apiError.message);
      
      // If Ollama fails, try falling back to Hugging Face
      if (provider === 'ollama') {
        console.log("Falling back to Hugging Face API");
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        // Format the prompt for Hugging Face
        const formattedPrompt = AI_PROVIDER.templates.huggingface.system.replace('{system}', systemPrompt)
                                                                  .replace('{user}', prompt);
        
        // Call Hugging Face API as fallback
        response = await axios.post(
          AI_PROVIDER.endpoints.huggingface,
          {
            inputs: formattedPrompt,
            parameters: AI_PROVIDER.parameters.huggingface
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        // Re-throw the error if we're already using Hugging Face
        throw apiError;
      }
    }

    // Parse the AI response
    let aiResponse;
    try {
      // Get the raw response text based on provider
      let output = "";
      
      if (provider === 'ollama') {
        // Ollama returns response in a different format
        output = response.data.response || "{}";
      } else {
        // Hugging Face response format
        if (Array.isArray(response.data)) {
          output = response.data[0]?.generated_text?.trim() || "{}";
        } else if (typeof response.data === 'object' && response.data.generated_text) {
          output = response.data.generated_text.trim();
        } else if (typeof response.data === 'string') {
          output = response.data.trim();
        } else {
          output = JSON.stringify(response.data);
        }
      }
      
      console.log(`Raw ${provider} response:`, JSON.stringify(output));
      
      // Try to parse the JSON directly first
      try {
        aiResponse = JSON.parse(output);
        console.log("Successfully parsed JSON directly");
      } catch (directParseError) {
        console.log("Direct JSON parsing failed, trying to extract JSON from text");
        
        // If direct parsing fails, try to extract JSON from the response
        // Extract JSON from the response text
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
            aiResponse = JSON.parse(jsonString);
            console.log("Successfully parsed extracted JSON");
          } catch (innerError) {
            console.error("Failed to parse extracted JSON:", innerError);
            console.error("Extracted JSON string:", jsonString);
            
            // Try to fix common JSON issues
            try {
              // Replace Python-style single quotes with double quotes
              const fixedJson = jsonString
                .replace(/'/g, '"')
                .replace(/None/g, 'null')
                .replace(/True/g, 'true')
                .replace(/False/g, 'false');
              
              aiResponse = JSON.parse(fixedJson);
              console.log("Successfully parsed fixed JSON");
            } catch (fixError) {
              console.error("Failed to parse fixed JSON:", fixError);
              // Fallback to a default response
              aiResponse = {
                extractedData: null,
                nextQuestion: {
                  dataType: "retry",
                  question: "I'm having trouble understanding. Could you please provide the information again?"
                },
                conversationalResponse: "I'm having trouble setting up your business strategy data. Please try again later."
              };
            }
          }
        } else {
          console.error("No JSON object found in response");
          // If no JSON object found, create a default response
          aiResponse = {
            extractedData: null,
            nextQuestion: {
              dataType: "retry",
              question: "I'm having trouble understanding. Could you please provide the information again?"
            },
            conversationalResponse: "I'm having trouble setting up your business strategy data. Please try again later."
          };
        }
      }
      
      // Validate the response structure
      if (!aiResponse.conversationalResponse || 
          (aiResponse.extractedData === undefined && aiResponse.nextQuestion === undefined)) {
        console.error("Invalid response structure:", aiResponse);
        throw new Error("Invalid response structure");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      
      // Provide a fallback response
      aiResponse = {
        extractedData: null,
        nextQuestion: {
          dataType: "retry",
          question: "I'm having trouble understanding. Could you please provide the information again?"
        },
        conversationalResponse: "I'm having trouble setting up your business strategy data. Please try again later."
      };
    }

    // If we extracted data, save it
    if (aiResponse.extractedData && aiResponse.extractedData.dataType && aiResponse.extractedData.value) {
      const { dataType, value } = aiResponse.extractedData;
      
      // Save the data based on its type
      if (["organizationName", "industry", "companySize", "ceoName", "ceoEmail", "departments"].includes(dataType)) {
        // Organization data
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/save-data`,
          { dataType, value },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (["organizationProblems", "userStrategy", "valueProposition", "solutionStrategy", 
                 "managementStrategy", "businessOutcomes", "costStructure", "peopleStrategy"].includes(dataType)) {
        // Business strategy data
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/business-strategy`,
          { dataType, value },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("AI Data Collection Error:", error.message);
    return NextResponse.json({ 
      message: "AI data collection failed", 
      error: error.message 
    }, { status: 500 });
  }
}