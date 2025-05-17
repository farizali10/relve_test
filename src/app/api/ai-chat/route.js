import { NextResponse } from "next/server";
import { connectDb } from "@/connectDb";
import jwt from "jsonwebtoken";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";
import { BusinessStrategy } from "../../../../models/BusinessStrategy";
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
    const businessStrategy = await BusinessStrategy.findOne({ user: userId });

    const details = [];

    // Basic organization details
    if (chatbot?.organizationName) details.push(`Organization: ${chatbot.organizationName}`);
    if (organization?.industry) details.push(`Industry: ${organization.industry}`);
    if (organization?.companySize) details.push(`Company Size: ${organization.companySize}`);
    if (chatbot?.ceoName) details.push(`CEO: ${chatbot.ceoName}`);
    if (chatbot?.ceoEmail) details.push(`CEO Email: ${chatbot.ceoEmail}`);
    if (chatbot?.departments?.length > 0)
      details.push(`Departments: ${chatbot.departments.map(d => d.departmentName).join(", ")}`);
    
    // Business strategy details
    if (businessStrategy) {
      if (businessStrategy.organizationProblems && businessStrategy.organizationProblems.length > 0) {
        details.push(`Top Organizational Problems: ${businessStrategy.organizationProblems.join(", ")}`);
      }
      
      if (businessStrategy.userStrategy && (businessStrategy.userStrategy.targetSegments || businessStrategy.userStrategy.growthPlans)) {
        const userStrategyDetails = [];
        if (businessStrategy.userStrategy.targetSegments) {
          userStrategyDetails.push(`Target Segments: ${businessStrategy.userStrategy.targetSegments}`);
        }
        if (businessStrategy.userStrategy.growthPlans) {
          userStrategyDetails.push(`Growth Plans: ${businessStrategy.userStrategy.growthPlans}`);
        }
        if (userStrategyDetails.length > 0) {
          details.push(`User & Organizational Strategy: ${userStrategyDetails.join("; ")}`);
        }
      }
      
      if (businessStrategy.valueProposition) {
        details.push(`Unique Value Proposition: ${businessStrategy.valueProposition}`);
      }
      
      if (businessStrategy.solutionStrategy && (businessStrategy.solutionStrategy.solution || businessStrategy.solutionStrategy.distributionStrategy)) {
        const solutionDetails = [];
        if (businessStrategy.solutionStrategy.solution) {
          solutionDetails.push(`Solution: ${businessStrategy.solutionStrategy.solution}`);
        }
        if (businessStrategy.solutionStrategy.distributionStrategy) {
          solutionDetails.push(`Distribution Strategy: ${businessStrategy.solutionStrategy.distributionStrategy}`);
        }
        if (solutionDetails.length > 0) {
          details.push(`Solution Strategy: ${solutionDetails.join("; ")}`);
        }
      }
      
      if (businessStrategy.managementStrategy) {
        details.push(`Management & Systems Strategy: ${businessStrategy.managementStrategy}`);
      }
      
      if (businessStrategy.businessOutcomes && (businessStrategy.businessOutcomes.revenueTargets || 
          businessStrategy.businessOutcomes.timeToHire || businessStrategy.businessOutcomes.retentionGoals)) {
        const outcomeDetails = [];
        if (businessStrategy.businessOutcomes.revenueTargets) {
          outcomeDetails.push(`Revenue Targets: ${businessStrategy.businessOutcomes.revenueTargets}`);
        }
        if (businessStrategy.businessOutcomes.timeToHire) {
          outcomeDetails.push(`Time-to-Hire: ${businessStrategy.businessOutcomes.timeToHire}`);
        }
        if (businessStrategy.businessOutcomes.retentionGoals) {
          outcomeDetails.push(`Retention Goals: ${businessStrategy.businessOutcomes.retentionGoals}`);
        }
        if (outcomeDetails.length > 0) {
          details.push(`Business Outcomes: ${outcomeDetails.join("; ")}`);
        }
      }
      
      if (businessStrategy.costStructure && (businessStrategy.costStructure.budgetPerDepartment || 
          businessStrategy.costStructure.headcountCaps)) {
        const costDetails = [];
        if (businessStrategy.costStructure.budgetPerDepartment) {
          costDetails.push(`Budget per Department: ${businessStrategy.costStructure.budgetPerDepartment}`);
        }
        if (businessStrategy.costStructure.headcountCaps) {
          costDetails.push(`Headcount Caps: ${businessStrategy.costStructure.headcountCaps}`);
        }
        if (costDetails.length > 0) {
          details.push(`Cost Structure: ${costDetails.join("; ")}`);
        }
      }
      
      if (businessStrategy.peopleStrategy && (businessStrategy.peopleStrategy.criticalRoles || 
          businessStrategy.peopleStrategy.skillPriorities || businessStrategy.peopleStrategy.benchStrength)) {
        const peopleDetails = [];
        if (businessStrategy.peopleStrategy.criticalRoles) {
          peopleDetails.push(`Critical Roles: ${businessStrategy.peopleStrategy.criticalRoles}`);
        }
        if (businessStrategy.peopleStrategy.skillPriorities) {
          peopleDetails.push(`Skill Priorities: ${businessStrategy.peopleStrategy.skillPriorities}`);
        }
        if (businessStrategy.peopleStrategy.benchStrength) {
          peopleDetails.push(`Bench Strength: ${businessStrategy.peopleStrategy.benchStrength}`);
        }
        if (peopleDetails.length > 0) {
          details.push(`People Strategy: ${peopleDetails.join("; ")}`);
        }
      }
    }

    // Check if all business strategy data is available
    const missingBusinessStrategyData = [];
    
    if (!businessStrategy || !businessStrategy.organizationProblems || businessStrategy.organizationProblems.length === 0) {
      missingBusinessStrategyData.push("organizational problems");
    }
    
    if (!businessStrategy || !businessStrategy.userStrategy || !businessStrategy.userStrategy.targetSegments || !businessStrategy.userStrategy.growthPlans) {
      missingBusinessStrategyData.push("user & organizational strategy");
    }
    
    if (!businessStrategy || !businessStrategy.valueProposition) {
      missingBusinessStrategyData.push("unique value proposition");
    }
    
    if (!businessStrategy || !businessStrategy.solutionStrategy || !businessStrategy.solutionStrategy.solution || !businessStrategy.solutionStrategy.distributionStrategy) {
      missingBusinessStrategyData.push("solution & distribution strategy");
    }
    
    if (!businessStrategy || !businessStrategy.managementStrategy) {
      missingBusinessStrategyData.push("management & systems strategy");
    }
    
    if (!businessStrategy || !businessStrategy.businessOutcomes || !businessStrategy.businessOutcomes.revenueTargets || !businessStrategy.businessOutcomes.timeToHire || !businessStrategy.businessOutcomes.retentionGoals) {
      missingBusinessStrategyData.push("business outcomes");
    }
    
    if (!businessStrategy || !businessStrategy.costStructure || !businessStrategy.costStructure.budgetPerDepartment || !businessStrategy.costStructure.headcountCaps) {
      missingBusinessStrategyData.push("cost structure");
    }
    
    if (!businessStrategy || !businessStrategy.peopleStrategy || !businessStrategy.peopleStrategy.criticalRoles || !businessStrategy.peopleStrategy.skillPriorities || !businessStrategy.peopleStrategy.benchStrength) {
      missingBusinessStrategyData.push("people strategy");
    }
    
    // If any business strategy data is missing, return an error
    if (missingBusinessStrategyData.length > 0) {
      return NextResponse.json(
        { 
          message: `Before I can answer your questions, I need more information about your business strategy. Missing data: ${missingBusinessStrategyData.join(", ")}`,
          missingData: true,
          missingBusinessStrategyData
        }, 
        { status: 400 }
      );
    }
    
    const context = details.join(" | ");

    const prompt = `
You are an AI assistant with access to the following company data: 
${context || "No data available"}

You are an expert in organizational design, HR strategy, and workforce planning. Your goal is to help the user understand their organization better and identify potential gaps that might prevent them from reaching their business goals.

IMPORTANT INSTRUCTIONS:
1. ONLY use the information provided in the context above.
2. DO NOT make up or hallucinate any information that is not explicitly provided in the context.
3. If asked about data that is not in the context, clearly state that this information is not available and suggest that the user provide it.
4. Be specific and precise in your analysis, using only the facts provided.

ORGANIZATIONAL RISK ANALYSIS:
If the user asks about organizational risks AND all necessary data is available, analyze the data to identify:
1. Span-of-control risks: Identify teams with more than 8-10 direct reports, which may indicate management overload and reduced effectiveness.
2. Skill gaps: Compare the company's stated skill priorities with their business outcomes and value proposition to identify misalignments.
3. Role redundancies: Look for overlapping responsibilities across departments that could indicate inefficiencies.
4. Value proposition misalignment: Assess if the current organizational structure and skills support the company's unique value proposition.
5. Attrition risks: Based on industry benchmarks, identify departments or roles that may be at higher risk of turnover.

ORGANIZATIONAL SIMULATION:
If the user asks about simulating changes to the organization AND all necessary data is available, provide thoughtful analysis on how those changes might impact:
1. Headcount and cost structure: Calculate approximate changes to departmental budgets and overall headcount.
2. Business outcomes: Assess how the changes would affect the company's ability to achieve stated revenue targets, time-to-hire goals, and retention objectives.
3. Team effectiveness: Evaluate how reporting structures would change and whether this would improve or hinder communication and decision-making.
4. Risk profile: Determine if the changes would introduce new risks or mitigate existing ones.

SPECIFIC QUERIES TO HANDLE:
- "Show me all teams with more than 10 direct reports" - Analyze department structure to identify span-of-control issues
- "What are our top 3 hidden workforce risks?" - Analyze based on stated outcomes and people strategy
- "Which roles have skills that misalign with our UVP?" - Compare role skills with the value proposition
- "If we reduce Team X by 2 headcount, how does it affect our outcomes?" - Simulate the impact of headcount reduction
- "What learning paths should we prioritize?" - Recommend based on skill gaps and business strategy

Only answer questions that are clearly related to this company. If the user says something like "hello", "hi", or "how are you", reply very briefly (under 15 words). 

If the question is unclear or unrelated, say: "Can you please clarify your question?"

If the user asks for information that isn't available in the context, be specific about what additional data would be helpful to collect.

User: ${question}
AI:
    `.trim();

    const apiKey = process.env.HUGGINGFACE_API_KEY;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
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
