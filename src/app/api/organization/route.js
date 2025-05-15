import { connectDb } from "@/connectDb";
import { NextResponse } from "next/server";
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

    const organization = await Organization.findOne({ user: userId });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization, { status: 200 });
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

    const existingOrg = await Organization.findOne({ user: userId });
    if (existingOrg) {
      return NextResponse.json(
        { message: "User already has an organization" },
        { status: 400 }
      );
    }

    const formdata = await request.formData();

    const name = formdata.get("name");
    const industry = formdata.get("industry");
    const companySize = formdata.get("companySize");
    const city = formdata.get("city");
    const country = formdata.get("country");
    const yearFounded = Number(formdata.get("yearFounded"));
    const organizationType = formdata.get("organizationType");
    const numberOfOffices = Number(formdata.get("numberOfOffices"));
    const hrToolsUsed = formdata.get("hrToolsUsed");
    const hiringLevel = formdata.get("hiringLevel");
    const workModel = formdata.get("workModel");

    if (
      !name ||
      !industry ||
      !companySize ||
      !city ||
      !country ||
      !yearFounded ||
      !organizationType ||
      numberOfOffices === undefined ||
      !hrToolsUsed ||
      !hiringLevel ||
      !workModel
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const organization = await Organization.create({
      name,
      industry,
      companySize,
      city,
      country,
      yearFounded,
      organizationType,
      numberOfOffices,
      hrToolsUsed,
      hiringLevel,
      workModel,
      user: userId,
    });

    return NextResponse.json(
      {
        organization,
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.user) {
      return NextResponse.json(
        { message: "User already has an organization" },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
