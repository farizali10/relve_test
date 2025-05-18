import { NextResponse } from "next/server";
import { connectDb } from "@/connectDb";
import jwt from "jsonwebtoken";
import { User } from "../../../../models/User";

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

    // Parse request
    const { aiProvider } = await request.json();
    
    // Validate the provider
    if (aiProvider && !["auto", "ollama", "huggingface"].includes(aiProvider)) {
      return NextResponse.json({ 
        message: "Invalid AI provider" 
      }, { status: 400 });
    }

    // Update user preferences
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update the AI provider preference
    if (aiProvider) {
      user.preferences.aiProvider = aiProvider;
    }

    // Save the updated user
    await user.save();

    return NextResponse.json({
      message: "User preferences updated successfully",
      preferences: user.preferences
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json({ 
      message: "Error updating user preferences", 
      error: error.message 
    }, { status: 500 });
  }
}