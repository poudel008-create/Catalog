"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedCatalogs = exports.deleteCatalog = exports.updateCatalog = exports.getCatalog = exports.getCatalogs = exports.createCatalog = void 0;
const stream_1 = require("stream");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const catalogModel_1 = __importDefault(require("../Models/catalogModel"));
// CREATE CATALOG
const createCatalog = async (req, res) => {
    try {
        const { title, description, category, subCategory } = req.body;
        if (!title) {
            return res.status(400).json({
                message: "Catalog title is required",
            });
        }
        let coverImage = "";
        // Upload cover image if provided
        if (req.file) {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                folder: "catalog-covers",
                resource_type: "image",
            }, async (error, result) => {
                if (error || !result) {
                    return res.status(500).json({
                        message: "Cloudinary upload failed",
                    });
                }
                const catalog = await catalogModel_1.default.create({
                    title,
                    description,
                    category,
                    subCategory,
                    coverImage: result.secure_url,
                    createdBy: req.user?.id,
                });
                return res.status(201).json({
                    message: "Catalog created successfully",
                    catalog,
                });
            });
            stream_1.Readable.from(req.file.buffer).pipe(uploadStream);
            return;
        }
        // Create catalog without cover image
        const catalog = await catalogModel_1.default.create({
            title,
            description,
            category,
            subCategory,
            createdBy: req.user?.id,
        });
        res.status(201).json({
            message: "Catalog created successfully",
            catalog,
        });
    }
    catch (error) {
        console.error("CREATE CATALOG ERROR:", error);
        res.status(500).json({
            message: "Failed to create catalog",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createCatalog = createCatalog;
// GET ALL CATALOGS
const getCatalogs = async (req, res) => {
    try {
        const catalogs = await catalogModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            catalogs,
        });
    }
    catch (error) {
        console.error("GET CATALOGS ERROR:", error);
        res.status(500).json({
            message: "Failed to get catalogs",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getCatalogs = getCatalogs;
// GET SINGLE CATALOG
const getCatalog = async (req, res) => {
    try {
        const catalog = await catalogModel_1.default.findById(req.params.id);
        if (!catalog) {
            return res.status(404).json({
                message: "Catalog not found",
            });
        }
        res.status(200).json({
            catalog,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get catalog",
            error,
        });
    }
};
exports.getCatalog = getCatalog;
// UPDATE CATALOG
const updateCatalog = async (req, res) => {
    try {
        const { title, description, category, subCategory } = req.body ?? {};
        const published = req.body?.published === "true" ||
            req.body?.published === true;
        const catalog = await catalogModel_1.default.findById(req.params.id);
        if (!catalog) {
            return res.status(404).json({
                message: "Catalog not found",
            });
        }
        if (req.body?.published !== undefined) {
            catalog.published = published;
        }
        // Update text fields only if provided
        if (title !== undefined) {
            catalog.title = title;
        }
        if (description !== undefined) {
            catalog.description = description;
        }
        if (category !== undefined) {
            catalog.category = category;
        }
        if (subCategory !== undefined) {
            catalog.subCategory = subCategory;
        }
        // Update cover image if new image is uploaded
        if (req.file) {
            // Delete old cover image if it exists
            if (catalog.coverImage) {
                try {
                    const oldPublicId = catalog.coverImage
                        .split("/")
                        .slice(-2)
                        .join("/")
                        .split(".")[0];
                    await cloudinary_1.default.uploader.destroy(oldPublicId);
                }
                catch (error) {
                    console.log("Old cover image delete failed:", error);
                }
            }
            const updatedCatalog = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: "catalog-covers",
                    resource_type: "image",
                }, (error, result) => {
                    if (error || !result) {
                        reject(error ||
                            new Error("Cloudinary upload failed"));
                        return;
                    }
                    resolve(result);
                });
                stream_1.Readable.from(req.file.buffer).pipe(uploadStream);
            });
            catalog.coverImage =
                updatedCatalog.secure_url;
        }
        await catalog.save();
        return res.status(200).json({
            message: "Catalog updated successfully",
            catalog,
        });
    }
    catch (error) {
        console.error("UPDATE CATALOG ERROR:", error);
        return res.status(500).json({
            message: "Failed to update catalog",
            error: error instanceof Error
                ? error.message
                : error,
        });
    }
};
exports.updateCatalog = updateCatalog;
// DELETE CATALOG
const deleteCatalog = async (req, res) => {
    try {
        const catalog = await catalogModel_1.default.findByIdAndDelete(req.params.id);
        if (!catalog) {
            return res.status(404).json({
                message: "Catalog not found",
            });
        }
        res.status(200).json({
            message: "Catalog deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to delete catalog",
            error,
        });
    }
};
exports.deleteCatalog = deleteCatalog;
const getPublishedCatalogs = async (req, res) => {
    try {
        const catalogs = await catalogModel_1.default.find({
            published: true,
        }).sort({ createdAt: -1 });
        res.status(200).json({
            catalogs,
        });
    }
    catch (error) {
        console.error("GET PUBLISHED CATALOGS ERROR:", error);
        res.status(500).json({
            message: "Failed to get published catalogs",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getPublishedCatalogs = getPublishedCatalogs;
