"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubCategory = exports.updateSubCategory = exports.createSubCategory = exports.getSubCategories = void 0;
const categoryModel_1 = __importDefault(require("../Models/categoryModel"));
const subCategoryModel_1 = __importDefault(require("../Models/subCategoryModel"));
const slugify_1 = require("../utils/slugify");
const getSubCategories = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category: String(category) } : {};
        const subCategories = await subCategoryModel_1.default.find(filter)
            .populate("category", "name slug")
            .sort({ name: 1 });
        res.status(200).json({ subCategories });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get sub-categories",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getSubCategories = getSubCategories;
// POST /api/subcategories  (admin)
const createSubCategory = async (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Sub-category name is required" });
        }
        if (!category) {
            return res.status(400).json({ message: "Parent category is required" });
        }
        const parent = await categoryModel_1.default.findById(category);
        if (!parent) {
            return res.status(404).json({ message: "Parent category not found" });
        }
        const slug = (0, slugify_1.slugify)(String(name));
        const existing = await subCategoryModel_1.default.findOne({ category, slug });
        if (existing) {
            return res
                .status(409)
                .json({
                message: "This category already has a sub-category with that name",
            });
        }
        const subCategory = await subCategoryModel_1.default.create({
            name: String(name).trim(),
            slug,
            category,
        });
        await subCategory.populate("category", "name slug");
        res.status(201).json({
            message: "Sub-category created successfully",
            subCategory,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create sub-category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createSubCategory = createSubCategory;
// PUT /api/subcategories/:id  (admin)
const updateSubCategory = async (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Sub-category name is required" });
        }
        if (!category) {
            return res.status(400).json({ message: "Parent category is required" });
        }
        const parent = await categoryModel_1.default.findById(category);
        if (!parent) {
            return res.status(404).json({ message: "Parent category not found" });
        }
        const slug = (0, slugify_1.slugify)(String(name));
        const clash = await subCategoryModel_1.default.findOne({
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
        const subCategory = await subCategoryModel_1.default.findByIdAndUpdate(req.params.id, { name: String(name).trim(), slug, category }, { new: true, runValidators: true }).populate("category", "name slug");
        if (!subCategory) {
            return res.status(404).json({ message: "Sub-category not found" });
        }
        res.status(200).json({
            message: "Sub-category updated successfully",
            subCategory,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update sub-category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateSubCategory = updateSubCategory;
// DELETE /api/subcategories/:id  (admin)
const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await subCategoryModel_1.default.findByIdAndDelete(req.params.id);
        if (!subCategory) {
            return res.status(404).json({ message: "Sub-category not found" });
        }
        res.status(200).json({
            message: "Sub-category deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to delete sub-category",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteSubCategory = deleteSubCategory;
