import { Request, Response } from "express";
import Category from "../Models/categoryModel";
import SubCategory from "../Models/subCategoryModel";
import { slugify } from "../utils/slugify";

// GET /api/subcategories            (public) -> all
// GET /api/subcategories?category=… (public) -> scoped to one category
export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const filter = category ? { category: String(category) } : {};

    const subCategories = await SubCategory.find(filter)
      .populate("category", "name slug")
      .sort({ name: 1 });

    res.status(200).json({ subCategories });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get sub-categories",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// POST /api/subcategories  (admin)
export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    if (!category) {
      return res.status(400).json({ message: "Parent category is required" });
    }

    const parent = await Category.findById(category);
    if (!parent) {
      return res.status(404).json({ message: "Parent category not found" });
    }

    const slug = slugify(String(name));

    const existing = await SubCategory.findOne({ category, slug });
    if (existing) {
      return res
        .status(409)
        .json({
          message: "This category already has a sub-category with that name",
        });
    }

    const subCategory = await SubCategory.create({
      name: String(name).trim(),
      slug,
      category,
    });

    await subCategory.populate("category", "name slug");

    res.status(201).json({
      message: "Sub-category created successfully",
      subCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create sub-category",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// PUT /api/subcategories/:id  (admin)
export const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    if (!category) {
      return res.status(400).json({ message: "Parent category is required" });
    }

    const parent = await Category.findById(category);
    if (!parent) {
      return res.status(404).json({ message: "Parent category not found" });
    }

    const slug = slugify(String(name));

    const clash = await SubCategory.findOne({
      category,
      slug,
      _id: { $ne: req.params.id },
    });
    if (clash) {
      return res
        .status(409)
        .json({
          message: "This category already has a sub-category with that name",
        });
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name: String(name).trim(), slug, category },
      { new: true, runValidators: true }
    ).populate("category", "name slug");

    if (!subCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }

    res.status(200).json({
      message: "Sub-category updated successfully",
      subCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update sub-category",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// DELETE /api/subcategories/:id  (admin)
export const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

    if (!subCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }

    res.status(200).json({
      message: "Sub-category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete sub-category",
      error: error instanceof Error ? error.message : error,
    });
  }
};
