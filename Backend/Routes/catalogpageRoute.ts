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

// PUBLIC - Get pages
router.get("/:catalogId", getCatalogPages);

// ADMIN - Upload page
router.post(
  "/:catalogId",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("page"),
  uploadCatalogPage
);

// ADMIN - Update page number
router.put(
  "/page/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateCatalogPage
);

// ADMIN - Delete page
router.delete(
  "/page/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCatalogPage
);

export default router;