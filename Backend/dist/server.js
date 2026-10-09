"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const seedAdmin_1 = __importDefault(require("./seedAdmin"));
const userRoute_1 = __importDefault(require("./Routes/userRoute"));
const catalogRoute_1 = __importDefault(require("./Routes/catalogRoute"));
const catalogpageRoute_1 = __importDefault(require("./Routes/catalogpageRoute"));
const categoryRoute_1 = __importDefault(require("./Routes/categoryRoute"));
const subCategoryRoute_1 = __importDefault(require("./Routes/subCategoryRoute"));
const app = (0, express_1.default)();
// Allowed frontend origins
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGINS ??
    "http://localhost:5173,http://localhost:5174,http://localhost:4173,https://catalog-bbcz.vercel.app")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        console.error("Blocked CORS origin:", origin);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Handle preflight requests
app.options(/.*/, (0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Database initialization
let initializationPromise = null;
const initializeApp = async () => {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            await (0, db_1.default)();
            await (0, seedAdmin_1.default)();
        })().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }
    await initializationPromise;
};
// Initialize database before API requests
app.use(async (_req, res, next) => {
    try {
        await initializeApp();
        next();
    }
    catch (error) {
        console.error("Database initialization failed:", error);
        res.status(500).json({
            message: "Server initialization failed",
        });
    }
});
// Health check
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Backend is running",
    });
});
// API routes
app.use("/api/auth", userRoute_1.default);
app.use("/api/catalogs", catalogRoute_1.default);
app.use("/api/catalog-pages", catalogpageRoute_1.default);
app.use("/api/categories", categoryRoute_1.default);
app.use("/api/subcategories", subCategoryRoute_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error("UNHANDLED ERROR:", err.message);
    res.status(500).json({
        message: err.message || "Internal server error",
    });
});
// Start server for Render and local development
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
