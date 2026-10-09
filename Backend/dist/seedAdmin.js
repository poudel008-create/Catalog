"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = __importDefault(require("./Models/userModel"));
const seedAdmin = async () => {
    try {
        const existingAdmin = await userModel_1.default.findOne({
            email: process.env.ADMIN_EMAIL,
        });
        const hashedPassword = await bcryptjs_1.default.hash(process.env.ADMIN_PASSWORD, 10);
        if (existingAdmin) {
            existingAdmin.password = hashedPassword;
            existingAdmin.role = "admin";
            existingAdmin.name = "Alisha Poudel";
            await existingAdmin.save();
            console.log("Admin already exists. Password updated.");
            return;
        }
        await userModel_1.default.create({
            name: "Alisha Poudel",
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
        });
        console.log("Admin created successfully");
    }
    catch (error) {
        console.log("SEED ADMIN ERROR:", error instanceof Error ? error.message : "Unknown error");
    }
};
exports.default = seedAdmin;
