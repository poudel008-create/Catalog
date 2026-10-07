import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import connectDB from "./config/db";
import seedAdmin from "./seedAdmin";
import userRoute from "./Routes/userRoute";
import catalogRoute from "./Routes/catalogRoute";
import catalogpageRoute from "./Routes/catalogpageRoute"
import categoryRoute from "./Routes/categoryRoute"
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
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", userRoute);
app.use("/api/catalogs", catalogRoute);
app.use("/api/catalog-pages", catalogpageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/subcategories", subCategoryRoute);

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is running");
});

// 404 handler for unknown API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler (keeps responses JSON, never leaks stack to clients)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("UNHANDLED ERROR:", err.message);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, async () => {
  await connectDB();
  await seedAdmin();

  console.log(`Server running on http://localhost:${PORT}`);
});
