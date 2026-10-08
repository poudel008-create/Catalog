import express from "express";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../Controllers/categoryController";

import { authMiddleware } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorization";

const router = express.Router();

// PUBLIC
router.get("/", getCategories);

// ADMIN ONLY
router.post("/", authMiddleware, authorizeRoles("admin"), createCategory);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateCategory);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteCategory);

export default router;
