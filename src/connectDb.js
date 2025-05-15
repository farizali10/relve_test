import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGO_URL, {
      dbName: "ReeORG",
    });
    console.log("Mongodb connected");
  } catch (error) {
    console.log(error);
  }
};
