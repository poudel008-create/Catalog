
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

const ALLOWED_ORIGINS = (
  process.env.CLIENT_ORIGINS ??
  "http://localhost:5173,http://localhost:5174,http://localhost:4173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`Origin ${origin} not allowed by CORS`)
    );
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database and admin once per running instance.
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

// Ensure database initialization before handling API requests.
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

app.use("/api/auth", userRoute);
app.use("/api/catalogs", catalogRoute);
app.use("/api/catalog-pages", catalogpageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/subcategories", subCategoryRoute);

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is running");
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
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

// Local development only
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;