import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Chatbot } from "../../../../models/Chatbot";
import { Organization } from "../../../../models/Organization";
import { Department } from "../../../../models/Departments";

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

    // Fetch all relevant data for this user
    const chatbotData = await Chatbot.findOne({ user: userId });
    const organizationData = await Organization.findOne({ user: userId });
    const departmentsData = await Department.find({ user: userId });

    // Initialize data requirements object
    const dataRequirements = {
      organizationName: false,
      industry: false,
      companySize: false,
      ceoName: false,
      ceoEmail: false,
      departments: []
    };

    // Check what data is available
    if (chatbotData) {
      dataRequirements.organizationName = !!chatbotData.organizationName;
      dataRequirements.ceoName = !!chatbotData.ceoName;
      dataRequirements.ceoEmail = !!chatbotData.ceoEmail;
      
      if (chatbotData.departments && chatbotData.departments.length > 0) {
        dataRequirements.departments = chatbotData.departments.map(dept => dept.departmentName);
      }
    }

    if (organizationData) {
      dataRequirements.industry = !!organizationData.industry;
      dataRequirements.companySize = !!organizationData.companySize;
    }

    // Get missing data types
    const missingData = [];
    if (!dataRequirements.organizationName) missingData.push("organizationName");
    if (!dataRequirements.industry) missingData.push("industry");
    if (!dataRequirements.companySize) missingData.push("companySize");
    if (!dataRequirements.ceoName) missingData.push("ceoName");
    if (!dataRequirements.ceoEmail) missingData.push("ceoEmail");
    if (dataRequirements.departments.length < 1) missingData.push("departments");

    return NextResponse.json({
      dataRequirements,
      missingData,
      status: 200
    });
  } catch (error) {
    console.error("Check Data Error:", error);
    return NextResponse.json({ 
      message: "Error checking data", 
      error: error.message 
    }, { status: 500 });
  }
}