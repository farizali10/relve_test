import { NextResponse } from "next/server";
import { connectDb } from "@/connectDb";
import jwt from "jsonwebtoken";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";
import axios from "axios";

export async function POST(request) {
  try {
    await connectDb();

    // Auth
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    // Parse user input
    const { question } = await request.json();

    // Pull user-specific data
    const chatbot = await Chatbot.findOne({ user: userId });
    const organization = await Organization.findOne({ user: userId });
    const departments = await Department.find({ user: userId });

    const details = [];

    if (chatbot?.organizationName) details.push(`Organization: ${chatbot.organizationName}`);
    if (organization?.industry) details.push(`Industry: ${organization.industry}`);
    if (organization?.companySize) details.push(`Company Size: ${organization.companySize}`);
    if (chatbot?.ceoName) details.push(`CEO: ${chatbot.ceoName}`);
    if (chatbot?.ceoEmail) details.push(`CEO Email: ${chatbot.ceoEmail}`);
    if (chatbot?.departments?.length > 0)
      details.push(`Departments: ${chatbot.departments.map(d => d.departmentName).join(", ")}`);

    const context = details.join(" | ");

    const prompt = `
You are an AI assistant with access to the following company data: 
${context || "No data available"}

Only answer questions that are clearly related to this company. If the user says something like "hello", "hi", or "how are you", reply very briefly (under 15 words). 

If the question is unclear or unrelated, say: "Can you please clarify your question?"

Always keep your answers short, specific, and focused.

User: ${question}
AI:
    `.trim();

    const apiKey = process.env.HUGGINGFACE_API_KEY;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.5,
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

    const output = Array.isArray(response.data)
      ? response.data[0]?.generated_text?.trim() || "No response generated."
      : JSON.stringify(response.data);

    return NextResponse.json({ answer: output });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("AI Chat Error:", errData);
    return NextResponse.json({ message: "AI chat failed", error: errData }, { status: 500 });
  }
}
