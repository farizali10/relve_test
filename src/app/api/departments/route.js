import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
import { Department } from "../../../../models/Department";
import { Organization } from "../../../../models/Organization";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectDb();

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    const departments = await Department.find({ user: userId }).populate(
      "organization"
    );

    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const userId = decoded.id;

    const formdata = await request.formData();

    const departmentName = formdata.get("departmentName");
    const hodName = formdata.get("hodName");
    const role = formdata.get("role");
    const email = formdata.get("email");
    const reportTo = formdata.get("reportTo");

    if (
      !departmentName ||
      !hodName ||
      !role ||
      !email ||
      !reportTo
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const organization = await Organization.findOne({ user: userId });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found for the user." },
        { status: 404 }
      );
    }

    const department = await Department.create({
      departmentName,
      hodName,
      role,
      email,
      reportTo,
      organization: organization._id,
      user: userId,
    });

    return NextResponse.json(
      {
        department,
        message: "Department created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000 && error.keyPattern) {
      if (
        error.keyPattern.organization &&
        error.keyPattern.user &&
        error.keyPattern.departmentName
      ) {
        return NextResponse.json(
          {
            message:
              "Department with this name already exists in this organization for this user.",
          },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
