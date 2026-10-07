import express from "express";

import {
  createCatalog,
  getCatalogs,
  getCatalog,
  updateCatalog,
  deleteCatalog,
} from "../Controllers/catalogController";
import upload from "../middleware/upload";

import { authMiddleware } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorization";
const router = express.Router();

// PUBLIC
router.get("/", getCatalogs);
router.get("/:id", getCatalog);

// ADMIN ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("coverImage"),
  createCatalog
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateCatalog
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCatalog
);

export default router;