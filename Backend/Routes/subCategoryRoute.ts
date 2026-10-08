import express from "express";

import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../Controllers/subCategoryController";

import { authMiddleware } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorization";

const router = express.Router();

// PUBLIC
router.get("/", getSubCategories);

// ADMIN ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  createSubCategory
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateSubCategory
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteSubCategory
);

export default router;