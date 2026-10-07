import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("MONGODB connected!!");
  } catch (error) {
    console.log(
      "MongoDB connection failed!!",
      error instanceof Error ? error.message : "Unknown error"
    );

    process.exit(1);
  }
};

export default connectDB;