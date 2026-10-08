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

// ADMIN

//  Add one or multiple pages
router.post(
  "/:catalogId",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("pages", 20),
  uploadCatalogPage
);

// Update one or multiple pages
router.put(
  "/:catalogId/pages",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("page", 20),
  updateCatalogPage
);

// Delete one or multiple pages
router.delete(
  "/page/:pageId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCatalogPage
);

export default router;