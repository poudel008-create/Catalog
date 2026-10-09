
import "dotenv/config";

import cookieParser from "cookie-parser";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import connectDB from "./config/db";
import seedAdmin from "./seedAdmin";

import userRoute from "./Routes/userRoute";
import catalogRoute from "./Routes/catalogRoute";
import catalogpageRoute from "./Routes/catalogpageRoute";
import categoryRoute from "./Routes/categoryRoute";
import subCategoryRoute from "./Routes/subCategoryRoute";

const app = express();

// Allowed frontend origins
const ALLOWED_ORIGINS = (
  process.env.CLIENT_ORIGINS ??
  "http://localhost:5173,http://localhost:5174,http://localhost:4173,https://catalog-bbcz.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
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
  })
);

// Handle preflight requests
app.options(/.*/, cors({
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

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database initialization
let initializationPromise: Promise<void> | null = null;

const initializeApp = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDB();
      await seedAdmin();
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
};

// Initialize database before API requests
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await initializeApp();
    next();
  } catch (error) {
    console.error("Database initialization failed:", error);

    res.status(500).json({
      message: "Server initialization failed",
    });
  }
});

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Backend is running",
  });
});

// API routes
app.use("/api/auth", userRoute);
app.use("/api/catalogs", catalogRoute);
app.use("/api/catalog-pages", catalogpageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/subcategories", subCategoryRoute);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("UNHANDLED ERROR:", err.message);

    res.status(500).json({
      message: err.message || "Internal server error",
    });
  }
);

// Start server for Render and local development
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;