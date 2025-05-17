import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { BusinessStrategy } from "../../../../models/BusinessStrategy";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";

// Function to extract the actual value from natural language responses
function extractValueFromResponse(dataType, response) {
  if (!response || typeof response !== 'string') {
    return response;
  }
  
  const responseText = response.toLowerCase().trim();
  
  // Extract organizational problems
  if (dataType === "organizationProblems") {
    // If it's already an array, return it
    if (Array.isArray(response)) {
      return response;
    }
    
    // Look for numbered or bulleted lists
    const listPattern = /(?:\d+[\.\)]\s*|\*\s*|\-\s*)(.+?)(?=\n\d+[\.\)]\s*|\n\*\s*|\n\-\s*|$)/g;
    const matches = [...responseText.matchAll(listPattern)];
    
    if (matches.length > 0) {
      return matches.map(match => match[1].trim()).slice(0, 3);
    }
    
    // Look for comma-separated lists
    if (responseText.includes(',')) {
      return responseText.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .slice(0, 3);
    }
    
    // If no list pattern is found, return the whole text as a single problem
    return [responseText];
  }
  
  // Extract user strategy
  if (dataType === "userStrategy") {
    if (typeof response === 'object') {
      return response;
    }
    
    const targetSegmentsPatterns = [
      /(?:target|our|main) (?:segments?|audience|customers?|users?|market|clients?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|growth|plans)/i,
      /we (?:target|serve|focus on)(?:\s+the)?\s+(.+?)(?=\.|$|growth|plans)/i
    ];
    
    const growthPlansPatterns = [
      /(?:growth|expansion|future) (?:plans?|strategy|goals?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i,
      /we (?:plan|aim|intend|want) to (.+?)(?=\.|$)/i,
      /(?:planning|aiming) to (.+?)(?=\.|$)/i
    ];
    
    let targetSegments = "";
    let growthPlans = "";
    
    // Try to extract target segments
    for (const pattern of targetSegmentsPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        targetSegments = match[1].trim();
        break;
      }
    }
    
    // Try to extract growth plans
    for (const pattern of growthPlansPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        growthPlans = match[1].trim();
        break;
      }
    }
    
    // If we couldn't extract specific parts, split the text
    if (!targetSegments && !growthPlans && responseText.includes('.')) {
      const sentences = responseText.split('.');
      if (sentences.length >= 2) {
        targetSegments = sentences[0].trim();
        growthPlans = sentences.slice(1).join('.').trim();
      }
    }
    
    // If still no specific parts, use the whole text for both
    if (!targetSegments && !growthPlans) {
      targetSegments = responseText;
      growthPlans = responseText;
    }
    
    return {
      targetSegments,
      growthPlans
    };
  }
  
  // For other simple string fields, just return the response
  if (dataType === "valueProposition" || 
      dataType === "managementStrategy") {
    return responseText;
  }
  
  // Extract solution strategy
  if (dataType === "solutionStrategy") {
    if (typeof response === 'object') {
      return response;
    }
    
    const solutionPatterns = [
      /(?:solution|product|service|offering)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|distribution)/i,
      /we (?:offer|provide|deliver|sell)(?:\s+the)?\s+(.+?)(?=\.|$|distribution)/i
    ];
    
    const distributionPatterns = [
      /(?:distribution|marketing|sales|rollout) (?:strategy|approach|plan|channel)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i,
      /we (?:market|sell|distribute|promote)(?:\s+through|via|using)?\s+(.+?)(?=\.|$)/i
    ];
    
    let solution = "";
    let distributionStrategy = "";
    
    // Try to extract solution
    for (const pattern of solutionPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        solution = match[1].trim();
        break;
      }
    }
    
    // Try to extract distribution strategy
    for (const pattern of distributionPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        distributionStrategy = match[1].trim();
        break;
      }
    }
    
    // If we couldn't extract specific parts, split the text
    if (!solution && !distributionStrategy && responseText.includes('.')) {
      const sentences = responseText.split('.');
      if (sentences.length >= 2) {
        solution = sentences[0].trim();
        distributionStrategy = sentences.slice(1).join('.').trim();
      }
    }
    
    // If still no specific parts, use the whole text for both
    if (!solution && !distributionStrategy) {
      solution = responseText;
      distributionStrategy = responseText;
    }
    
    return {
      solution,
      distributionStrategy
    };
  }
  
  // Extract business outcomes
  if (dataType === "businessOutcomes") {
    if (typeof response === 'object') {
      return response;
    }
    
    const revenuePatterns = [
      /(?:revenue|sales|financial) (?:targets?|goals?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|time|retention)/i,
      /we (?:aim|target|plan) to (?:achieve|reach|generate|make)(?:\s+revenue of)?\s+(.+?)(?=\.|$|time|retention)/i
    ];
    
    const timeToHirePatterns = [
      /(?:time[\- ]to[\- ]hire|hiring time|recruitment time)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|retention)/i,
      /we (?:aim|want|plan) to hire (?:within|in)?\s+(.+?)(?=\.|$|retention)/i
    ];
    
    const retentionPatterns = [
      /(?:retention|turnover|attrition) (?:goals?|targets?|rates?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i,
      /we (?:aim|want|plan) to (?:retain|keep)(?:\s+employees for)?\s+(.+?)(?=\.|$)/i,
      /(?:employee|staff) retention (?:of|at|around)?\s+(.+?)(?=\.|$)/i
    ];
    
    let revenueTargets = "";
    let timeToHire = "";
    let retentionGoals = "";
    
    // Try to extract revenue targets
    for (const pattern of revenuePatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        revenueTargets = match[1].trim();
        break;
      }
    }
    
    // Try to extract time to hire
    for (const pattern of timeToHirePatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        timeToHire = match[1].trim();
        break;
      }
    }
    
    // Try to extract retention goals
    for (const pattern of retentionPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        retentionGoals = match[1].trim();
        break;
      }
    }
    
    // If we couldn't extract specific parts, split the text
    if (!revenueTargets && !timeToHire && !retentionGoals && responseText.includes('.')) {
      const sentences = responseText.split('.');
      if (sentences.length >= 3) {
        revenueTargets = sentences[0].trim();
        timeToHire = sentences[1].trim();
        retentionGoals = sentences.slice(2).join('.').trim();
      } else if (sentences.length === 2) {
        revenueTargets = sentences[0].trim();
        timeToHire = sentences[1].trim();
        retentionGoals = sentences[1].trim();
      }
    }
    
    // If still no specific parts, use the whole text for all
    if (!revenueTargets && !timeToHire && !retentionGoals) {
      revenueTargets = responseText;
      timeToHire = responseText;
      retentionGoals = responseText;
    }
    
    return {
      revenueTargets,
      timeToHire,
      retentionGoals
    };
  }
  
  // Extract cost structure
  if (dataType === "costStructure") {
    if (typeof response === 'object') {
      return response;
    }
    
    const budgetPatterns = [
      /(?:budget|spending|expenditure)(?:\s+per|\s+by|\s+for)?\s+(?:department|team|division)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|headcount)/i,
      /we (?:allocate|spend|budget)(?:\s+per|\s+by|\s+for)?\s+(?:department|team|division)?\s+(.+?)(?=\.|$|headcount)/i
    ];
    
    const headcountPatterns = [
      /(?:headcount|employee|staff) (?:caps?|limits?|restrictions?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i,
      /we (?:limit|cap|restrict) (?:headcount|employees|staff) to\s+(.+?)(?=\.|$)/i,
      /(?:maximum|max) (?:headcount|employees|staff)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i
    ];
    
    let budgetPerDepartment = "";
    let headcountCaps = "";
    
    // Try to extract budget per department
    for (const pattern of budgetPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        budgetPerDepartment = match[1].trim();
        break;
      }
    }
    
    // Try to extract headcount caps
    for (const pattern of headcountPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        headcountCaps = match[1].trim();
        break;
      }
    }
    
    // If we couldn't extract specific parts, split the text
    if (!budgetPerDepartment && !headcountCaps && responseText.includes('.')) {
      const sentences = responseText.split('.');
      if (sentences.length >= 2) {
        budgetPerDepartment = sentences[0].trim();
        headcountCaps = sentences.slice(1).join('.').trim();
      }
    }
    
    // If still no specific parts, use the whole text for both
    if (!budgetPerDepartment && !headcountCaps) {
      budgetPerDepartment = responseText;
      headcountCaps = responseText;
    }
    
    return {
      budgetPerDepartment,
      headcountCaps
    };
  }
  
  // Extract people strategy
  if (dataType === "peopleStrategy") {
    if (typeof response === 'object') {
      return response;
    }
    
    const criticalRolesPatterns = [
      /(?:critical|key|essential|important) (?:roles?|positions?|jobs?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|skill|bench)/i,
      /(?:our|the) (?:critical|key|essential|important) (?:roles?|positions?|jobs?) (?:include|are|is)?\s+(.+?)(?=\.|$|skill|bench)/i
    ];
    
    const skillPrioritiesPatterns = [
      /(?:skill|competency|capability) (?:priorities?|focus|areas?)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$|bench)/i,
      /(?:our|the) (?:skill|competency|capability) (?:priorities?|focus|areas?) (?:include|are|is)?\s+(.+?)(?=\.|$|bench)/i,
      /we (?:prioritize|focus on|need) (?:skills?|competencies?|capabilities?) (?:like|such as|including)?\s+(.+?)(?=\.|$|bench)/i
    ];
    
    const benchStrengthPatterns = [
      /(?:bench|talent|succession) (?:strength|pipeline|planning|readiness)(?:\s+is|\s+are|\s*:\s*)(.+?)(?=\.|$)/i,
      /(?:our|the) (?:bench|talent|succession) (?:strength|pipeline|planning|readiness) (?:include|are|is)?\s+(.+?)(?=\.|$)/i,
      /we (?:have|maintain|develop) (?:bench|talent|succession) (?:strength|pipeline|planning|readiness)?\s+(.+?)(?=\.|$)/i
    ];
    
    let criticalRoles = "";
    let skillPriorities = "";
    let benchStrength = "";
    
    // Try to extract critical roles
    for (const pattern of criticalRolesPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        criticalRoles = match[1].trim();
        break;
      }
    }
    
    // Try to extract skill priorities
    for (const pattern of skillPrioritiesPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        skillPriorities = match[1].trim();
        break;
      }
    }
    
    // Try to extract bench strength
    for (const pattern of benchStrengthPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        benchStrength = match[1].trim();
        break;
      }
    }
    
    // If we couldn't extract specific parts, split the text
    if (!criticalRoles && !skillPriorities && !benchStrength && responseText.includes('.')) {
      const sentences = responseText.split('.');
      if (sentences.length >= 3) {
        criticalRoles = sentences[0].trim();
        skillPriorities = sentences[1].trim();
        benchStrength = sentences.slice(2).join('.').trim();
      } else if (sentences.length === 2) {
        criticalRoles = sentences[0].trim();
        skillPriorities = sentences[1].trim();
        benchStrength = sentences[1].trim();
      }
    }
    
    // If still no specific parts, use the whole text for all
    if (!criticalRoles && !skillPriorities && !benchStrength) {
      criticalRoles = responseText;
      skillPriorities = responseText;
      benchStrength = responseText;
    }
    
    return {
      criticalRoles,
      skillPriorities,
      benchStrength
    };
  }
  
  // If no specific extraction logic, return the original value
  return response;
}

export async function GET(request) {
  try {
    await connectDb();

    // Authenticate user
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    // Check if organization data exists first
    const chatbotData = await Chatbot.findOne({ user: userId });
    const organizationData = await Organization.findOne({ user: userId });
    
    if (!chatbotData || !organizationData) {
      return NextResponse.json({ 
        message: "Please complete your organization setup first",
        hasOrganizationData: false
      }, { status: 200 });
    }

    // Get business strategy data
    let strategyData = await BusinessStrategy.findOne({ user: userId });
    
    if (!strategyData) {
      // Create a new empty strategy document if none exists
      strategyData = await BusinessStrategy.create({
        user: userId,
        organizationProblems: [],
        userStrategy: {
          targetSegments: "",
          growthPlans: ""
        },
        valueProposition: "",
        solutionStrategy: {
          solution: "",
          distributionStrategy: ""
        },
        managementStrategy: "",
        businessOutcomes: {
          revenueTargets: "",
          timeToHire: "",
          retentionGoals: ""
        },
        costStructure: {
          budgetPerDepartment: "",
          headcountCaps: ""
        },
        peopleStrategy: {
          criticalRoles: "",
          skillPriorities: "",
          benchStrength: ""
        }
      });
    }

    // Determine what data is missing
    const missingData = [];
    
    if (strategyData.organizationProblems.length === 0) {
      missingData.push("organizationProblems");
    }
    
    if (!strategyData.userStrategy.targetSegments || !strategyData.userStrategy.growthPlans) {
      missingData.push("userStrategy");
    }
    
    if (!strategyData.valueProposition) {
      missingData.push("valueProposition");
    }
    
    if (!strategyData.solutionStrategy.solution || !strategyData.solutionStrategy.distributionStrategy) {
      missingData.push("solutionStrategy");
    }
    
    if (!strategyData.managementStrategy) {
      missingData.push("managementStrategy");
    }
    
    if (!strategyData.businessOutcomes.revenueTargets || 
        !strategyData.businessOutcomes.timeToHire || 
        !strategyData.businessOutcomes.retentionGoals) {
      missingData.push("businessOutcomes");
    }
    
    if (!strategyData.costStructure.budgetPerDepartment || !strategyData.costStructure.headcountCaps) {
      missingData.push("costStructure");
    }
    
    if (!strategyData.peopleStrategy.criticalRoles || 
        !strategyData.peopleStrategy.skillPriorities || 
        !strategyData.peopleStrategy.benchStrength) {
      missingData.push("peopleStrategy");
    }

    return NextResponse.json({
      strategyData,
      missingData,
      hasOrganizationData: true,
      status: 200
    });
  } catch (error) {
    console.error("Business Strategy Error:", error);
    return NextResponse.json({ 
      message: "Error retrieving business strategy data", 
      error: error.message 
    }, { status: 500 });
  }
}

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

    // Get the data from the request
    const { dataType, value } = await request.json();
    if (!dataType) {
      return NextResponse.json(
        { message: "Data type is required" },
        { status: 400 }
      );
    }
    
    // Extract the actual value from natural language responses
    const extractedValue = extractValueFromResponse(dataType, value);

    // Find or create the business strategy document
    let strategyData = await BusinessStrategy.findOne({ user: userId });
    if (!strategyData) {
      strategyData = await BusinessStrategy.create({
        user: userId,
        organizationProblems: [],
        userStrategy: {
          targetSegments: "",
          growthPlans: ""
        },
        valueProposition: "",
        solutionStrategy: {
          solution: "",
          distributionStrategy: ""
        },
        managementStrategy: "",
        businessOutcomes: {
          revenueTargets: "",
          timeToHire: "",
          retentionGoals: ""
        },
        costStructure: {
          budgetPerDepartment: "",
          headcountCaps: ""
        },
        peopleStrategy: {
          criticalRoles: "",
          skillPriorities: "",
          benchStrength: ""
        }
      });
    }

    // Update the appropriate field based on dataType
    switch (dataType) {
      case "organizationProblems":
        // Handle array of problems
        if (Array.isArray(extractedValue)) {
          strategyData.organizationProblems = extractedValue.slice(0, 3); // Limit to 3 problems
        } else if (typeof extractedValue === 'string') {
          // If it's a single problem as a string, add it to the array
          if (strategyData.organizationProblems.length < 3) {
            strategyData.organizationProblems.push(extractedValue);
          }
        }
        break;

      case "userStrategy":
        if (extractedValue.targetSegments) {
          strategyData.userStrategy.targetSegments = extractedValue.targetSegments;
        }
        if (extractedValue.growthPlans) {
          strategyData.userStrategy.growthPlans = extractedValue.growthPlans;
        }
        break;

      case "valueProposition":
        strategyData.valueProposition = extractedValue;
        break;

      case "solutionStrategy":
        if (extractedValue.solution) {
          strategyData.solutionStrategy.solution = extractedValue.solution;
        }
        if (extractedValue.distributionStrategy) {
          strategyData.solutionStrategy.distributionStrategy = extractedValue.distributionStrategy;
        }
        break;

      case "managementStrategy":
        strategyData.managementStrategy = extractedValue;
        break;

      case "businessOutcomes":
        if (extractedValue.revenueTargets) {
          strategyData.businessOutcomes.revenueTargets = extractedValue.revenueTargets;
        }
        if (extractedValue.timeToHire) {
          strategyData.businessOutcomes.timeToHire = extractedValue.timeToHire;
        }
        if (extractedValue.retentionGoals) {
          strategyData.businessOutcomes.retentionGoals = extractedValue.retentionGoals;
        }
        break;

      case "costStructure":
        if (extractedValue.budgetPerDepartment) {
          strategyData.costStructure.budgetPerDepartment = extractedValue.budgetPerDepartment;
        }
        if (extractedValue.headcountCaps) {
          strategyData.costStructure.headcountCaps = extractedValue.headcountCaps;
        }
        break;

      case "peopleStrategy":
        if (extractedValue.criticalRoles) {
          strategyData.peopleStrategy.criticalRoles = extractedValue.criticalRoles;
        }
        if (extractedValue.skillPriorities) {
          strategyData.peopleStrategy.skillPriorities = extractedValue.skillPriorities;
        }
        if (extractedValue.benchStrength) {
          strategyData.peopleStrategy.benchStrength = extractedValue.benchStrength;
        }
        break;

      default:
        return NextResponse.json(
          { message: "Invalid data type" },
          { status: 400 }
        );
    }

    // Save the updated document
    await strategyData.save();

    return NextResponse.json({
      message: "Business strategy data saved successfully",
      dataType,
      strategyData,
      originalValue: value,
      extractedValue,
      status: 200
    });
  } catch (error) {
    console.error("Save Business Strategy Error:", error);
    return NextResponse.json({ 
      message: "Error saving business strategy data", 
      error: error.message 
    }, { status: 500 });
  }
}