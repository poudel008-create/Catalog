"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../Models/userModel"));
// ==================== REGISTER ====================
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }
        const existingUser = await userModel_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await userModel_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: role || "user",
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error,
        });
    }
};
exports.registerUser = registerUser;
// ==================== LOGIN ====================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }
        const user = await userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        // Access token
        const accessToken = jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role,
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m",
        });
        // Refresh token
        const refreshToken = jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role,
        }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "7d",
        });
        // Store refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({
            message: "Login failed",
            error: error instanceof Error
                ? error.message
                : String(error),
        });
    }
};
exports.loginUser = loginUser;
// ==================== REFRESH TOKEN ====================
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({
                message: "Refresh token is required",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await userModel_1.default.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }
        // Create new access token
        const accessToken = jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role,
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m",
        });
        res.status(200).json({
            message: "Access token refreshed",
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
};
exports.refreshToken = refreshToken;
// ==================== LOGOUT ====================
const logoutUser = async (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.status(200).json({
        message: "Logout successful",
    });
};
exports.logoutUser = logoutUser;
