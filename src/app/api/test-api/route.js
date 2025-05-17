import { NextResponse } from "next/server";
import axios from "axios";

const MODEL_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct";

export async function GET(request) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "Hugging Face API key is not configured",
        apiKeyExists: false
      }, { status: 400 });
    }

    try {
      const response = await axios({
        method: 'post',
        url: MODEL_URL,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: "Hello, I'm a language model. Can you explain gravity in simple terms?",
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            return_full_text: true
          }
        }
      });

      return NextResponse.json({
        status: "success",
        message: "API key is valid and working",
        apiKeyExists: true,
        apiKeyValid: true,
        fullResponse: response.data
      });
    } catch (modelError) {
      return NextResponse.json({
        status: "error",
        message: "API key exists but may be invalid or expired",
        apiKeyExists: true,
        apiKeyValid: false,
        error: modelError.message
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Error testing API connection",
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "Hugging Face API key is not configured",
        apiKeyExists: false
      }, { status: 400 });
    }

    try {
      const response = await axios({
        method: 'post',
        url: MODEL_URL,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: "Can you explain how artificial intelligence works?",
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            return_full_text: true
          }
        }
      });

      return NextResponse.json({
        status: "success",
        message: "Llama model access is working",
        llamaAccessValid: true,
        fullResponse: response.data
      });
    } catch (modelError) {
      const errorMsg = modelError.message.toLowerCase();
      const isAccessIssue =
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("permission") ||
        errorMsg.includes("access") ||
        errorMsg.includes("not allowed");

      return NextResponse.json({
        status: "error",
        message: isAccessIssue
          ? "You don't have access to the Llama model. Make sure you've accepted the model license on Hugging Face."
          : "Error accessing Llama model",
        llamaAccessValid: false,
        isAccessIssue,
        error: modelError.message
      }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Error testing Llama model access",
      error: error.message
    }, { status: 500 });
  }
}
