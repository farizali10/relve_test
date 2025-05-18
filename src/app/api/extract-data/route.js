import { NextResponse } from "next/server";
import { connectDb } from "@/connectDb";
import jwt from "jsonwebtoken";
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

    // Parse request
    const { dataType, userResponse } = await request.json();
    
    if (!dataType || !userResponse) {
      return NextResponse.json({ 
        message: "Data type and user response are required" 
      }, { status: 400 });
    }

    // Create a prompt for the AI to extract structured data
    let prompt = "";
    let outputFormat = {};
    
    switch (dataType) {
      case "organizationProblems":
        prompt = `
        Extract the top organizational problems from the following text. 
        The user was asked to define their top 3 organizational problems.
        
        User response: "${userResponse}"
        
        Extract up to 3 distinct problems. If fewer than 3 are mentioned, that's fine.
        Format your response as a JSON array of strings, each representing one problem.
        `;
        break;
        
      case "userStrategy":
        prompt = `
        Extract the user & organizational strategy from the following text.
        The user was asked about their target segments and growth plans.
        
        User response: "${userResponse}"
        
        Extract:
        1. Target segments: Who the company serves or targets
        2. Growth plans: How they plan to grow or expand
        
        Format your response as a JSON object with "targetSegments" and "growthPlans" fields.
        `;
        outputFormat = {
          targetSegments: "",
          growthPlans: ""
        };
        break;
        
      case "valueProposition":
        prompt = `
        Extract the unique value proposition from the following text.
        The user was asked about what makes their company different.
        
        User response: "${userResponse}"
        
        Format your response as a simple string containing the value proposition.
        `;
        break;
        
      case "solutionStrategy":
        prompt = `
        Extract the solution and distribution strategy from the following text.
        The user was asked about their solution and how they market/roll out initiatives.
        
        User response: "${userResponse}"
        
        Extract:
        1. Solution: What product/service they offer
        2. Distribution strategy: How they market and distribute their solution
        
        Format your response as a JSON object with "solution" and "distributionStrategy" fields.
        `;
        outputFormat = {
          solution: "",
          distributionStrategy: ""
        };
        break;
        
      case "managementStrategy":
        prompt = `
        Extract the management & systems strategy from the following text.
        The user was asked about their tools, processes, and governance structures.
        
        User response: "${userResponse}"
        
        Format your response as a simple string containing the management strategy.
        `;
        break;
        
      case "businessOutcomes":
        prompt = `
        Extract the key business outcomes from the following text.
        The user was asked about revenue targets, time-to-hire goals, and retention objectives.
        
        User response: "${userResponse}"
        
        Extract:
        1. Revenue targets: Financial goals
        2. Time-to-hire: Recruitment timeline goals
        3. Retention goals: Employee retention objectives
        
        Format your response as a JSON object with "revenueTargets", "timeToHire", and "retentionGoals" fields.
        `;
        outputFormat = {
          revenueTargets: "",
          timeToHire: "",
          retentionGoals: ""
        };
        break;
        
      case "costStructure":
        prompt = `
        Extract the cost structure constraints from the following text.
        The user was asked about budget per department and headcount caps.
        
        User response: "${userResponse}"
        
        Extract:
        1. Budget per department: Financial allocation by department
        2. Headcount caps: Limits on team sizes
        
        Format your response as a JSON object with "budgetPerDepartment" and "headcountCaps" fields.
        `;
        outputFormat = {
          budgetPerDepartment: "",
          headcountCaps: ""
        };
        break;
        
      case "peopleStrategy":
        prompt = `
        Extract the people strategy from the following text.
        The user was asked about critical roles, skill priorities, and bench strength.
        
        User response: "${userResponse}"
        
        Extract:
        1. Critical roles: Key positions in the organization
        2. Skill priorities: Important skills for the organization
        3. Bench strength: Succession planning and talent pipeline
        
        Format your response as a JSON object with "criticalRoles", "skillPriorities", and "benchStrength" fields.
        `;
        outputFormat = {
          criticalRoles: "",
          skillPriorities: "",
          benchStrength: ""
        };
        break;
        
      default:
        return NextResponse.json({ 
          message: "Invalid data type" 
        }, { status: 400 });
    }
    
    // Add instructions for the AI to format the response
    prompt += `\n\nYour response should be valid JSON that can be parsed directly. Do not include any explanations, just the JSON.`;

    // Call the AI model to extract the data
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.2, // Lower temperature for more deterministic extraction
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
    
    // Process the AI response
    let extractedData;
    try {
      const aiResponse = Array.isArray(response.data)
        ? response.data[0]?.generated_text?.trim()
        : response.data;
        
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, use the raw text
        extractedData = aiResponse;
      }
      
      // For simple string responses, ensure we return a string
      if (dataType === "valueProposition" || dataType === "managementStrategy") {
        if (typeof extractedData === 'object') {
          extractedData = JSON.stringify(extractedData);
        }
      }
      
      // For array responses (organizationProblems), ensure we return an array
      if (dataType === "organizationProblems" && !Array.isArray(extractedData)) {
        if (typeof extractedData === 'string') {
          // Try to convert a string to an array
          extractedData = [extractedData];
        } else {
          // Default to empty array
          extractedData = [];
        }
      }
      
      // For object responses, ensure we have the expected structure
      if (outputFormat && typeof outputFormat === 'object' && typeof extractedData !== 'object') {
        extractedData = { ...outputFormat };
      }
      
    } catch (error) {
      console.error("Error parsing AI response:", error);
      
      // Fallback extraction based on data type
      if (dataType === "organizationProblems") {
        extractedData = [userResponse];
      } else if (outputFormat && typeof outputFormat === 'object') {
        // For structured data types, use the first part of the response for the first field
        // and the rest for other fields
        const parts = userResponse.split('.');
        
        if (dataType === "userStrategy") {
          extractedData = {
            targetSegments: parts[0] || userResponse,
            growthPlans: parts.slice(1).join('.') || parts[0] || userResponse
          };
        } else if (dataType === "solutionStrategy") {
          extractedData = {
            solution: parts[0] || userResponse,
            distributionStrategy: parts.slice(1).join('.') || parts[0] || userResponse
          };
        } else if (dataType === "businessOutcomes") {
          extractedData = {
            revenueTargets: parts[0] || userResponse,
            timeToHire: parts.length > 1 ? parts[1] : parts[0] || userResponse,
            retentionGoals: parts.length > 2 ? parts.slice(2).join('.') : parts[0] || userResponse
          };
        } else if (dataType === "costStructure") {
          extractedData = {
            budgetPerDepartment: parts[0] || userResponse,
            headcountCaps: parts.length > 1 ? parts.slice(1).join('.') : parts[0] || userResponse
          };
        } else if (dataType === "peopleStrategy") {
          extractedData = {
            criticalRoles: parts[0] || userResponse,
            skillPriorities: parts.length > 1 ? parts[1] : parts[0] || userResponse,
            benchStrength: parts.length > 2 ? parts.slice(2).join('.') : parts[0] || userResponse
          };
        }
      } else {
        // For simple string fields, use the raw response
        extractedData = userResponse;
      }
    }

    return NextResponse.json({
      extractedData,
      originalResponse: userResponse
    });
    
  } catch (error) {
    console.error("Data extraction error:", error);
    return NextResponse.json({ 
      message: "Error extracting data", 
      error: error.message 
    }, { status: 500 });
  }
}