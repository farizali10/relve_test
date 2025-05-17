import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";
import { BusinessStrategy } from "../../../../models/BusinessStrategy";

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
`.trim();

    const apiKey = process.env.HUGGINGFACE_API_KEY;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Parse the AI response
    let aiResponse;
    try {
      const output = Array.isArray(response.data)
        ? response.data[0]?.generated_text?.trim() || "{}"
        : response.data;
      
      // Extract JSON from the response
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse JSON from AI response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return NextResponse.json({ 
        message: "Failed to parse AI response", 
        error: parseError.message 
      }, { status: 500 });
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