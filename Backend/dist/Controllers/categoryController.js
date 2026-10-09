"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const categoryModel_1 = __importDefault(require("../Models/categoryModel"));
const subCategoryModel_1 = __importDefault(require("../Models/subCategoryModel"));
const slugify_1 = require("../utils/slugify");
const getCategories = async (_req, res) => {
    try {
        const categories = await categoryModel_1.default.find().sort({ name: 1 });
        const counts = await subCategoryModel_1.default.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
        const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
        res.status(200).json({
            categories: categories.map((category) => ({
                ...category.toObject(),
                subCategoryCount: countMap.get(String(category._id)) ?? 0,
            })),
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get categories",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getCategories = getCategories;
// POST /api/categories  (admin)
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        const slug = (0, slugify_1.slugify)(String(name));
        const existing = await categoryModel_1.default.findOne({ slug });
        if (existing) {
            return res
                .status(409)
                .json({ message: "A category with this name already exists" });
        }
        const category = await categoryModel_1.default.create({
            name: String(name).trim(),
            slug,
            description: description ? String(description).trim() : undefined,
        });
        res.status(201).json({
            message: "Category created successfully",
            category: { ...category.toObject(), subCategoryCount: 0 },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createCategory = createCategory;
// PUT /api/categories/:id  (admin)
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        const slug = (0, slugify_1.slugify)(String(name));
        const clash = await categoryModel_1.default.findOne({
            slug,
            _id: { $ne: req.params.id },
        });
        if (clash) {
            return res
                .status(409)
                .json({ message: "Another category already uses this name" });
        }
        const category = await categoryModel_1.default.findByIdAndUpdate(req.params.id, {
            name: String(name).trim(),
            slug,
            description: description ? String(description).trim() : undefined,
        }, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        const subCategoryCount = await subCategoryModel_1.default.countDocuments({
            category: category._id,
        });
        res.status(200).json({
            message: "Category updated successfully",
            category: { ...category.toObject(), subCategoryCount },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateCategory = updateCategory;
// DELETE /api/categories/:id  (admin)
// Also removes every sub-category that belongs to it.
const deleteCategory = async (req, res) => {
    try {
        const category = await categoryModel_1.default.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        await subCategoryModel_1.default.deleteMany({ category: category._id });
        res.status(200).json({
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to delete category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteCategory = deleteCategory;
