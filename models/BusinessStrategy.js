import mongoose from "mongoose";

const businessStrategySchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true 
    },
    organizationProblems: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 3;
        },
        message: "You can only define up to 3 organizational problems."
      }
    },
    userStrategy: {
      targetSegments: { type: String, default: "" },
      growthPlans: { type: String, default: "" }
    },
    valueProposition: { type: String, default: "" },
    solutionStrategy: {
      solution: { type: String, default: "" },
      distributionStrategy: { type: String, default: "" }
    },
    managementStrategy: { type: String, default: "" },
    businessOutcomes: {
      revenueTargets: { type: String, default: "" },
      timeToHire: { type: String, default: "" },
      retentionGoals: { type: String, default: "" }
    },
    costStructure: {
      budgetPerDepartment: { type: String, default: "" },
      headcountCaps: { type: String, default: "" }
    },
    peopleStrategy: {
      criticalRoles: { type: String, default: "" },
      skillPriorities: { type: String, default: "" },
      benchStrength: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

if (mongoose.models.BusinessStrategy) {
  delete mongoose.models.BusinessStrategy;
}

export const BusinessStrategy = mongoose.model("BusinessStrategy", businessStrategySchema);