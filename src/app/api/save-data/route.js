import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";

// Function to extract the actual value from natural language responses
function extractValueFromResponse(dataType, response) {
  const responseText = response.toLowerCase().trim();
  
  // Extract organization name
  if (dataType === "organizationName") {
    // Patterns like "my company is called X" or "the name is X"
    const namePatterns = [
      /my company(?:'s)? (?:name|is called|is) (?:is )?(.+)/i,
      /(?:the |our |)(?:organization|company|business)(?:'s)? name is (.+)/i,
      /(?:it's|its|it is) called (.+)/i,
      /(?:the |)name (?:of my|of our|of the) (?:company|organization|business) is (.+)/i,
      /we are called (.+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  // Extract industry
  if (dataType === "industry") {
    // Patterns like "we are in the X industry" or "it's X"
    const industryPatterns = [
      /(?:we are|we're|my company is|our company is) in (?:the )?(.+?)(?: industry| sector| field| business)?$/i,
      /(?:the |our |my )(?:industry|sector|field) is (.+)/i,
      /(?:it's|its|it is) (?:the )?(.+?)(?: industry| sector| field| business)?$/i
    ];
    
    for (const pattern of industryPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  // Extract company size
  if (dataType === "companySize") {
    // Look for number ranges in the response
    const sizeRanges = ["150-300", "300-450", "450-600", "600-850", "850-1000", "1000+"];
    
    for (const range of sizeRanges) {
      if (responseText.includes(range)) {
        return range;
      }
    }
    
    // Look for numbers
    const numberMatch = responseText.match(/(\d+)(?:\+|-\d+)?/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1]);
      
      // Map the number to a range
      if (number <= 300) return "150-300";
      if (number <= 450) return "300-450";
      if (number <= 600) return "450-600";
      if (number <= 850) return "600-850";
      if (number <= 1000) return "850-1000";
      return "1000+";
    }
  }
  
  // Extract CEO name
  if (dataType === "ceoName") {
    // Patterns like "our CEO is X" or "X is the CEO"
    const ceoPatterns = [
      /(?:our|the|my) (?:ceo|chief executive officer|boss|leader) is (.+)/i,
      /(.+?) is (?:our|the|my) (?:ceo|chief executive officer|boss|leader)/i,
      /(?:it's|its|it is) (.+)/i
    ];
    
    for (const pattern of ceoPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  // Extract CEO email
  if (dataType === "ceoEmail") {
    // Look for email pattern
    const emailMatch = responseText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) {
      return emailMatch[1];
    }
    
    // Patterns like "the email is X"
    const emailPatterns = [
      /(?:the |our |my |ceo'?s |his |her )email (?:address )?is (.+)/i,
      /(?:it's|its|it is) (.+)/i
    ];
    
    for (const pattern of emailPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  // Extract department name
  if (dataType === "departments") {
    // Patterns like "we have an X department" or "X is a department"
    const deptPatterns = [
      /(?:we have|there is|there's) (?:an?|the) (.+?)(?: department| team| division| group| unit)?$/i,
      /(?:my|our) company(?:'s)? (?:department|team|division|group|unit) is (.+)/i,
      /(.+?) (?:is|as) (?:a|the|our) (?:department|team|division|group|unit)/i,
      /(?:the |our |my )(?:department|team|division|group|unit) (?:name )?is (.+)/i
    ];
    
    for (const pattern of deptPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  // If no pattern matches, return the original value
  return response.trim();
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
    if (!dataType || !value) {
      return NextResponse.json(
        { message: "Data type and value are required" },
        { status: 400 }
      );
    }
    
    // Extract the actual value from natural language responses
    const extractedValue = extractValueFromResponse(dataType, value);
    console.log(`Saving data: ${dataType} = ${extractedValue} (original: ${value})`);

    // Process the data based on its type
    switch (dataType) {
      case "organizationName":
        // Create or update the Chatbot document with organization name
        await Chatbot.findOneAndUpdate(
          { user: userId },
          { 
            user: userId,
            organizationName: extractedValue,
            // Set default values for required fields if they don't exist
            $setOnInsert: {
              ceoName: "CEO", // Default value
              ceoEmail: "ceo@example.com", // Default value
              ceoPic: "https://via.placeholder.com/150", // Default value
            }
          },
          { upsert: true, new: true }
        );
        break;

      case "industry":
        // Create or update the Organization document with industry
        await Organization.findOneAndUpdate(
          { user: userId },
          { 
            user: userId,
            industry: extractedValue,
            // Set default values for required fields if they don't exist
            $setOnInsert: {
              name: "Your Organization", // Default value
              companySize: "150-300", // Default value
              city: "Your City", // Default value
              country: "Your Country", // Default value
              yearFounded: new Date().getFullYear() - 5, // Default value
              organizationType: "Private", // Default value
              numberOfOffices: 1, // Default value
              hrToolsUsed: "None", // Default value
              hiringLevel: "Moderate", // Default value
              workModel: "Hybrid", // Default value
            }
          },
          { upsert: true, new: true }
        );
        break;

      case "companySize":
        // Update the Organization document with company size
        await Organization.findOneAndUpdate(
          { user: userId },
          { companySize: extractedValue }
        );
        break;

      case "ceoName":
        // Update the Chatbot document with CEO name
        await Chatbot.findOneAndUpdate(
          { user: userId },
          { ceoName: extractedValue }
        );
        break;

      case "ceoEmail":
        // Update the Chatbot document with CEO email
        await Chatbot.findOneAndUpdate(
          { user: userId },
          { ceoEmail: extractedValue }
        );
        break;

      case "departments":
        // Add a department to the Chatbot document
        const chatbot = await Chatbot.findOne({ user: userId });
        if (!chatbot) {
          return NextResponse.json(
            { message: "Please set up your organization first" },
            { status: 400 }
          );
        }

        // Add the department to the departments array
        chatbot.departments.push({
          departmentName: extractedValue,
          hodName: "Department Head", // Default value
          hodPic: "https://via.placeholder.com/150", // Default value
          hodEmail: `${extractedValue.toLowerCase().replace(/\s+/g, '.')}@${chatbot.organizationName.toLowerCase().replace(/\s+/g, '')}.com`, // Default value
          role: "Department Head", // Default value
        });

        await chatbot.save();

        // Also create a Department document
        await Department.create({
          user: userId,
          organization: (await Organization.findOne({ user: userId }))._id,
          departmentName: extractedValue,
          hodName: "Department Head", // Default value
          role: "Department Head", // Default value
          email: `${extractedValue.toLowerCase().replace(/\s+/g, '.')}@${chatbot.organizationName.toLowerCase().replace(/\s+/g, '')}.com`, // Default value
          reportTo: chatbot.ceoName, // Default value
        });
        break;

      default:
        return NextResponse.json(
          { message: "Invalid data type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Data saved successfully",
      dataType,
      value: extractedValue,
      originalValue: value,
      status: 200
    });
  } catch (error) {
    console.error("Save Data Error:", error);
    return NextResponse.json({ 
      message: "Error saving data", 
      error: error.message 
    }, { status: 500 });
  }
}