import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
      type: Object,
      default: {
        aiProvider: "auto"
      }
    }
  },
  { timestamps: true }
);

mongoose.models = {};
export const User = mongoose.model("User", schema);
