"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleCatalogPages = exports.deleteCatalogPage = exports.updateCatalogPage = exports.getCatalogPages = exports.uploadCatalogPage = void 0;
const stream_1 = require("stream");
const catalogpageModel_1 = __importDefault(require("../Models/catalogpageModel"));
const catalogModel_1 = __importDefault(require("../Models/catalogModel"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
    const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: "catalog-pages", resource_type: "image" }, (error, result) => {
        if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
            return;
        }
        resolve(result);
    });
    stream_1.Readable.from(buffer).pipe(uploadStream);
});
const toArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value];
// delete pachi gap hatauna renumber
const renumberPages = async (catalogId) => {
    const pages = await catalogpageModel_1.default.find({ catalogId }).sort({ pageNumber: 1 });
    const ops = pages
        .map((p, index) => ({ page: p, newNumber: index + 1 }))
        .filter(({ page, newNumber }) => page.pageNumber !== newNumber)
        .map(({ page, newNumber }) => ({
        updateOne: {
            filter: { _id: page._id },
            update: { $set: { pageNumber: newNumber } },
        },
    }));
    if (ops.length > 0) {
        await catalogpageModel_1.default.bulkWrite(ops);
    }
};
// UPLOAD MULTIPLE CATALOG PAGES
const uploadCatalogPage = async (req, res) => {
    try {
        const catalogId = req.params.catalogId;
        const files = req.files;
        // Check files
        if (!files || files.length === 0) {
            return res.status(400).json({
                message: "At least one page image is required",
            });
        }
        // Check catalog
        const catalog = await catalogModel_1.default.findById(catalogId);
        if (!catalog) {
            return res.status(404).json({
                message: "Catalog not found",
            });
        }
        // Find last uploaded page
        const lastPage = await catalogpageModel_1.default.findOne({
            catalogId,
        }).sort({ pageNumber: -1 });
        // If no pages -> start from 1
        // If pages already exist -> continue from last page
        const startingPageNumber = lastPage
            ? lastPage.pageNumber + 1
            : 1;
        const pages = [];
        // Upload every file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Automatically generate page number
            const pageNumber = startingPageNumber + i;
            const page = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: "catalog-pages",
                    resource_type: "image",
                }, async (error, result) => {
                    if (error || !result) {
                        reject(error ||
                            new Error("Cloudinary upload failed"));
                        return;
                    }
                    try {
                        const createdPage = await catalogpageModel_1.default.create({
                            catalogId,
                            pageNumber,
                            imageUrl: result.secure_url,
                            publicId: result.public_id,
                        });
                        resolve(createdPage);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                stream_1.Readable.from(file.buffer).pipe(uploadStream);
            });
            pages.push(page);
        }
        return res.status(201).json({
            message: "Catalog pages uploaded successfully",
            pages,
        });
    }
    catch (error) {
        console.error("MULTIPLE PAGE UPLOAD ERROR:", error);
        return res.status(500).json({
            message: "Failed to upload catalog pages",
            error: error instanceof Error
                ? error.message
                : error,
        });
    }
};
exports.uploadCatalogPage = uploadCatalogPage;
//get catalogPages
const getCatalogPages = async (req, res) => {
    try {
        const { catalogId } = req.params;
        const pages = await catalogpageModel_1.default.find({
            catalogId,
        }).sort({ pageNumber: 1 });
        res.status(200).json({
            pages,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get catalog pages",
            error,
        });
    }
};
exports.getCatalogPages = getCatalogPages;
// update catalog
const updateCatalogPage = async (req, res) => {
    try {
        const catalogId = req.params.catalogId;
        const files = req.files;
        const pageIds = Array.isArray(req.body.pageIds)
            ? req.body.pageIds
            : [req.body.pageIds];
        const pageNumbers = Array.isArray(req.body.pageNumbers)
            ? req.body.pageNumbers
            : [req.body.pageNumbers];
        if (!pageIds || pageIds.length === 0) {
            return res.status(400).json({
                message: "Page ID is required",
            });
        }
        if (files && files.length > 0 && files.length !== pageIds.length) {
            return res.status(400).json({
                message: "Number of files and page IDs must match",
            });
        }
        const updatedPages = [];
        for (let i = 0; i < pageIds.length; i++) {
            const pageId = pageIds[i];
            const allPages = await catalogpageModel_1.default.find({ catalogId });
            const page = await catalogpageModel_1.default.findOne({
                _id: pageId,
                catalogId,
            });
            if (!page) {
                return res.status(404).json({
                    message: `Catalog page not found: ${pageId}`,
                });
            }
            // Update basic information
            if (pageNumbers[i] !== undefined && pageNumbers[i] !== "") {
                const newNumber = Number(pageNumbers[i]);
                if (!Number.isInteger(newNumber) || newNumber < 1) {
                    return res.status(400).json({
                        message: "Page number must be a positive whole number",
                    });
                }
                const oldNumber = page.pageNumber;
                if (newNumber !== oldNumber) {
                    const other = allPages.find((p) => p.pageNumber === newNumber &&
                        p._id.toString() !== page._id.toString());
                    if (other) {
                        other.pageNumber = oldNumber; // swap
                        await other.save();
                    }
                    page.pageNumber = newNumber;
                }
            }
            // If new image is provided
            if (files && files[i]) {
                // pahile naya upload
                const result = await uploadToCloudinary(files[i].buffer);
                // tespachi purano delete
                if (page.publicId) {
                    await cloudinary_1.default.uploader.destroy(page.publicId);
                }
                page.imageUrl = result.secure_url;
                page.publicId = result.public_id;
            }
            await page.save();
            updatedPages.push(page);
        }
        return res.status(200).json({
            message: "Catalog pages updated successfully",
            pages: updatedPages,
        });
    }
    catch (error) {
        console.error("Update catalog pages error:", error);
        return res.status(500).json({
            message: "Failed to update catalog pages",
            error,
        });
    }
};
exports.updateCatalogPage = updateCatalogPage;
// DELETE PAGE
// DELETE PAGE
const deleteCatalogPage = async (req, res) => {
    try {
        const { pageId } = req.params;
        if (!pageId) {
            return res.status(400).json({
                message: "Page ID is required",
            });
        }
        const page = await catalogpageModel_1.default.findById(pageId);
        if (!page) {
            return res.status(404).json({
                message: "Catalog page not found",
            });
        }
        const catalogId = page.catalogId.toString();
        // Delete image from Cloudinary
        if (page.publicId) {
            await cloudinary_1.default.uploader.destroy(page.publicId);
        }
        // Delete page from MongoDB
        await catalogpageModel_1.default.findByIdAndDelete(pageId);
        await renumberPages(catalogId);
        return res.status(200).json({
            message: "Catalog page deleted successfully",
            deletedPage: pageId,
        });
    }
    catch (error) {
        console.error("DELETE CATALOG PAGE ERROR:", error);
        return res.status(500).json({
            message: "Failed to delete catalog page",
            error: error instanceof Error
                ? error.message
                : error,
        });
    }
};
exports.deleteCatalogPage = deleteCatalogPage;
// DELETE MULTIPLE
const deleteMultipleCatalogPages = async (req, res) => {
    try {
        const catalogId = req.params.catalogId;
        const pageIds = toArray(req.body.pageIds);
        if (pageIds.length === 0) {
            return res.status(400).json({
                message: "At least one page ID is required",
            });
        }
        const pages = await catalogpageModel_1.default.find({
            _id: { $in: pageIds },
            catalogId,
        });
        if (pages.length === 0) {
            return res.status(404).json({ message: "No pages found" });
        }
        await Promise.all(pages
            .filter((p) => p.publicId)
            .map((p) => cloudinary_1.default.uploader.destroy(p.publicId)));
        await catalogpageModel_1.default.deleteMany({
            _id: { $in: pages.map((p) => p._id) },
        });
        await renumberPages(catalogId);
        return res.status(200).json({
            message: `${pages.length} page(s) deleted successfully`,
            deletedPages: pages.map((p) => p._id),
        });
    }
    catch (error) {
        console.error("BULK DELETE ERROR:", error);
        return res.status(500).json({
            message: "Failed to delete pages",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteMultipleCatalogPages = deleteMultipleCatalogPages;
