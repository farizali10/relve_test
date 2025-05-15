import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  departmentName: { type: String, required: true },
  hodName: { type: String, required: true },
  hodPic: { type: String, required: true },
  hodEmail: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  role: { type: String, required: true },
});

const chatbotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    organizationName: { type: String, required: true },
    ceoName: { type: String, required: true },
    ceoEmail: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    ceoPic: { type: String, required: true },
    departments: {
      type: [departmentSchema],
      default: [],
      validate: {
        validator: function (depts) {
          const names = depts.map((d) => d.departmentName.toLowerCase());
          return names.length === new Set(names).size;
        },
        message: "Department names must be unique within the organization.",
      },
    },
  },
  { timestamps: true }
);

if (mongoose.models.Chatbot) {
  delete mongoose.models.Chatbot;
}

export const Chatbot = mongoose.model("Chatbot", chatbotSchema);
