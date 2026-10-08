import express from "express";

import {
  uploadCatalogPage,
  getCatalogPages,
  deleteCatalogPage,
  updateCatalogPage,
} from "../Controllers/catalogpageController";

import { authMiddleware } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorization";
import upload from "../middleware/upload";

const router = express.Router();

// ==================== PUBLIC - Get Pages ====================

router.get(
  "/:catalogId",
  getCatalogPages
);

// ==================== ADMIN - Upload Multiple Pages ====================

router.post(
  "/:catalogId",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("pages", 50),
  uploadCatalogPage
);

// ==================== ADMIN - Update Page Number ====================

router.put(
  "/page/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateCatalogPage
);

// ==================== ADMIN - Delete Page ====================

router.delete(
  "/page/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCatalogPage
);

export default router;