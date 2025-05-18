import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // If no API key is configured, return unavailable
    if (!apiKey) {
      return NextResponse.json({ status: "unavailable", message: "No API key configured" });
    }
    
    // Check if the API key is valid by making a simple request
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
        { inputs: "Hello" },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      // If we get a successful response, the API key is valid
      return NextResponse.json({ status: "available", message: "API key is valid" });
    } catch (error) {
      // Check if the error is due to rate limiting
      if (error.response && error.response.status === 429) {
        return NextResponse.json({ status: "limited", message: "Rate limited" });
      }
      
      // Check if the error is due to payment required
      if (error.response && error.response.status === 402) {
        return NextResponse.json({ status: "limited", message: "Payment required" });
      }
      
      // If the error is due to an invalid API key
      if (error.response && error.response.status === 401) {
        return NextResponse.json({ status: "unavailable", message: "Invalid API key" });
      }
      
      // For any other error, return error
      return NextResponse.json({ status: "error", message: error.message });
    }
  } catch (error) {
    console.error("Error checking Hugging Face status:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}