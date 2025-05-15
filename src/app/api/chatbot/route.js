import { connectDb } from "@/connectDb";
import { Chatbot } from "../../../../models/Chatbot";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import uploadFile from "../../../../middlewares/upload";

export async function GET(request) {
  try {
    await connectDb();
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    const chatbotData = await Chatbot.findOne({ user: userId });
    if (!chatbotData) {
      return NextResponse.json(
        { message: "No chatbot data found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chatbotData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    const formdata = await request.formData();
    const step = formdata.get("step");

    if (!step)
      return NextResponse.json(
        { message: "Step is required" },
        { status: 400 }
      );

    if (step === "org") {
      const organizationName = formdata.get("organizationName");
      const ceoName = formdata.get("ceoName");
      const ceoEmail = formdata.get("ceoEmail");
      const ceoPicFile = formdata.get("ceoPic");

      if (
        !organizationName ||
        !ceoName ||
        !ceoEmail ||
        !ceoPicFile ||
        ceoPicFile.size === 0
      ) {
        return NextResponse.json(
          { message: "All organization fields are required." },
          { status: 400 }
        );
      }

      const existing = await Chatbot.findOne({ user: userId });
      if (existing) {
        return NextResponse.json(
          { message: "Organization already created." },
          { status: 400 }
        );
      }

      const uploaded = await uploadFile(ceoPicFile);
      const ceoPic = uploaded.url;

      const chatbotDoc = await Chatbot.create({
        user: userId,
        organizationName,
        ceoName,
        ceoEmail,
        ceoPic,
        departments: [],
      });

      return NextResponse.json(
        { chatbot: chatbotDoc, message: "Organization created successfully." },
        { status: 201 }
      );
    } else if (step === "department") {
      const departmentName = formdata.get("departmentName");
      const hodName = formdata.get("hodName");
      const hodEmail = formdata.get("hodEmail");
      const hodPicFile = formdata.get("hodPic");
      const role = formdata.get("role");

      if (
        !departmentName ||
        !hodName ||
        !hodEmail ||
        !role ||
        !hodPicFile ||
        hodPicFile.size === 0
      ) {
        return NextResponse.json(
          { message: "All department fields are required." },
          { status: 400 }
        );
      }

      const chatbotDoc = await Chatbot.findOne({ user: userId });
      if (!chatbotDoc) {
        return NextResponse.json(
          {
            message:
              "Organization not found. Please create organization first.",
          },
          { status: 404 }
        );
      }

      const exists = chatbotDoc.departments.some(
        (d) => d.departmentName.toLowerCase() === departmentName.toLowerCase()
      );
      if (exists) {
        return NextResponse.json(
          { message: "Department name already exists." },
          { status: 400 }
        );
      }

      const uploaded = await uploadFile(hodPicFile);
      const hodPic = uploaded.url;

      chatbotDoc.departments.push({
        departmentName,
        hodName,
        hodEmail,
        hodPic,
        role,
      });

      await chatbotDoc.save();

      return NextResponse.json(
        { chatbot: chatbotDoc, message: "Department added successfully." },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ message: "Invalid step." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
