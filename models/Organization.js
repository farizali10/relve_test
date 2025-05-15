import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        "Healthcare and Social Assistance",
        "Finance and Insurance",
        "Professional, Scientific and Technical Services",
        "Information Technology (IT) and Software",
        "Telecommunications",
      ],
    },
    companySize: {
      type: String,
      required: true,
      enum: ["150-300", "300-450", "450-600", "600-850", "850-1000", "1000+"],
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    yearFounded: {
      type: Number,
      required: true,
    },
    organizationType: {
      type: String,
      required: true,
      enum: ["Private", "Public", "Non-Profit", "Government"],
    },
    numberOfOffices: {
      type: Number,
      required: true,
      min: 0,
    },
    hrToolsUsed: {
      type: String,
      required: true,
    },
    hiringLevel: {
      type: String,
      required: true,
      enum: ["Low", "Moderate", "High"],
    },
    workModel: {
      type: String,
      required: true,
      enum: ["Onsite", "Remote", "Hybrid", "Mixed"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Organization) {
  delete mongoose.models.Organization;
}

export const Organization = mongoose.model("Organization", organizationSchema);
