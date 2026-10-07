import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

import connectDB from "./config/db";
import seedAdmin from "./seedAdmin";
import userRoute from "./Routes/userRoute";
import catalogRoute from "./Routes/catalogRoute";
import catalogpageRoute from "./Routes/catalogpageRoute"

const app = express();

const CorsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(CorsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", userRoute);
app.use("/api/catalogs", catalogRoute);
app.use("/api/catalog-pages", catalogpageRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  await seedAdmin();

  console.log(`Server running on http://localhost:${PORT}`);
});











