import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";
import { User } from "../../../../models/User";
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client for Llama
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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

    // Get the user's question from the request
    const { question } = await request.json();
    if (!question) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    // Fetch all relevant data for this user
    const user = await User.findById(userId);
    const chatbotData = await Chatbot.findOne({ user: userId });
    const organizationData = await Organization.findOne({ user: userId });
    const departmentsData = await Department.find({ user: userId });

    // If no data is found, return an error
    if (!chatbotData && !organizationData && departmentsData.length === 0) {
      return NextResponse.json(
        { message: "No company data found. Please set up your organization first." },
        { status: 404 }
      );
    }

    // Prepare the context for OpenAI
    let context = "Here is the information about the company:\n\n";

    // Add organization information if available
    if (chatbotData) {
      context += `Organization Name: ${chatbotData.organizationName}\n`;
      context += `CEO: ${chatbotData.ceoName} (${chatbotData.ceoEmail})\n\n`;
      
      if (chatbotData.departments && chatbotData.departments.length > 0) {
        context += "Departments from Organization Chart:\n";
        chatbotData.departments.forEach(dept => {
          context += `- ${dept.departmentName}: Headed by ${dept.hodName} (${dept.role}, ${dept.hodEmail})\n`;
        });
        context += "\n";
      }
    }

    // Add more detailed organization information if available
    if (organizationData) {
      context += `Industry: ${organizationData.industry}\n`;
      context += `Company Size: ${organizationData.companySize}\n`;
      context += `Location: ${organizationData.city}, ${organizationData.country}\n`;
      context += `Year Founded: ${organizationData.yearFounded}\n`;
      context += `Organization Type: ${organizationData.organizationType}\n`;
      context += `Number of Offices: ${organizationData.numberOfOffices}\n`;
      context += `HR Tools Used: ${organizationData.hrToolsUsed}\n`;
      context += `Hiring Level: ${organizationData.hiringLevel}\n`;
      context += `Work Model: ${organizationData.workModel}\n\n`;
    }

    // Add department information if available
    if (departmentsData && departmentsData.length > 0) {
      context += "Detailed Department Information:\n";
      departmentsData.forEach(dept => {
        context += `- ${dept.departmentName}: Headed by ${dept.hodName} (${dept.role})\n`;
        context += `  Reports to: ${dept.reportTo}\n`;
        context += `  Contact: ${dept.email}\n`;
      });
      context += "\n";
    }
    
    // Add information about the purpose of the chatbot
    context += "The goal of this AI assistant is to help users understand the company structure and answer questions about the organization. ";
    context += "It should help identify gaps that might prevent the company from reaching its business goals based on the available information.\n\n";
    
    // Add instructions for handling unknown information
    context += "If asked about information that is not available in the context provided, the assistant should politely explain that it doesn't have that specific information and suggest what kind of data might be needed to answer the question more effectively."

    // Format the prompt for Llama
    const systemPrompt = `You are an AI assistant for a company. Your goal is to help users understand the company structure and answer questions about the organization.
    You should help identify gaps that might prevent the company from reaching its business goals based on the available information.
    Use the following company information to answer questions accurately. If you don't know the answer, say so honestly and suggest what information would be needed.
    
    ${context}`;
    
    const fullPrompt = `<s>[INST] <<SYS>>
${systemPrompt}
<</SYS>>

${question} [/INST]`;

    // Send the request to Hugging Face (using Meta's Llama 2 model)
    const response = await hf.textGeneration({
      model: "meta-llama/Llama-2-7b-chat-hf", // Using Llama 2 7B chat model
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
      }
    });

    // Return the AI's response
    return NextResponse.json({
      answer: response.generated_text.replace(fullPrompt, "").trim(),
      status: 200
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ 
      message: "Error processing your request", 
      error: error.message 
    }, { status: 500 });
  }
}