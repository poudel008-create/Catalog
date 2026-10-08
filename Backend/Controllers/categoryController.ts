import { Request, Response } from "express";
import Category from "../Models/categoryModel";
import SubCategory from "../Models/subCategoryModel";
import { slugify } from "../utils/slugify";
import { AuthRequest } from "../middleware/authMiddleware";


export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    const counts = await SubCategory.aggregate<{
      _id: unknown;
      count: number;
    }>([{ $group: { _id: "$category", count: { $sum: 1 } } }]);

    const countMap = new Map(
      counts.map((c) => [String(c._id), c.count])
    );

    res.status(200).json({
      categories: categories.map((category) => ({
        ...category.toObject(),
        subCategoryCount: countMap.get(String(category._id)) ?? 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get categories",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// POST /api/categories  (admin)
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(String(name));

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A category with this name already exists" });
    }

    const category = await Category.create({
      name: String(name).trim(),
      slug,
      description: description ? String(description).trim() : undefined,
    });

    res.status(201).json({
      message: "Category created successfully",
      category: { ...category.toObject(), subCategoryCount: 0 },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create category",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// PUT /api/categories/:id  (admin)
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(String(name));

    const clash = await Category.findOne({
      slug,
      _id: { $ne: req.params.id },
    });
    if (clash) {
      return res
        .status(409)
        .json({ message: "Another category already uses this name" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: String(name).trim(),
        slug,
        description: description ? String(description).trim() : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategoryCount = await SubCategory.countDocuments({
      category: category._id,
    });

    res.status(200).json({
      message: "Category updated successfully",
      category: { ...category.toObject(), subCategoryCount },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update category",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// DELETE /api/categories/:id  (admin)
// Also removes every sub-category that belongs to it.
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await SubCategory.deleteMany({ category: category._id });

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete category",
      error: error instanceof Error ? error.message : error,
    });
  }
};
