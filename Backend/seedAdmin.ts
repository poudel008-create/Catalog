import "dotenv/config";
import bcrypt from "bcryptjs";
import User from "./Models/userModel";

const seedAdmin = async (): Promise<void> => {
  try {
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD as string,
      10
    );

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      existingAdmin.name = "Alisha Poudel";

      await existingAdmin.save();

      console.log("Admin already exists. Password updated.");
      return;
    }

    await User.create({
      name: "Alisha Poudel",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.log(
      "SEED ADMIN ERROR:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

export default seedAdmin;