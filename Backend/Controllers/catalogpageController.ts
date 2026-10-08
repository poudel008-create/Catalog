import { Request, Response } from "express";
import { Readable } from "stream";

import CatalogPage from "../Models/catalogpageModel";
import Catalog from "../Models/catalogModel";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/authMiddleware";


// upload multiple pages in catalog

// UPLOAD MULTIPLE CATALOG PAGES
export const uploadCatalogPage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalogId = req.params.catalogId as string;

    const files = req.files as Express.Multer.File[];

    // Check files
    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "At least one page image is required",
      });
    }

    // Check catalog
    const catalog = await Catalog.findById(catalogId);

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    // Find last uploaded page
    const lastPage = await CatalogPage.findOne({
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

      const page = await new Promise<any>((resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "catalog-pages",
              resource_type: "image",
            },
            async (error, result) => {
              if (error || !result) {
                reject(
                  error ||
                    new Error("Cloudinary upload failed")
                );
                return;
              }

              try {
                const createdPage =
                  await CatalogPage.create({
                    catalogId,
                    pageNumber,
                    imageUrl: result.secure_url,
                    publicId: result.public_id,
                  });

                resolve(createdPage);
              } catch (error) {
                reject(error);
              }
            }
          );

        Readable.from(file.buffer).pipe(uploadStream);
      });

      pages.push(page);
    }

    return res.status(201).json({
      message: "Catalog pages uploaded successfully",
      pages,
    });
  } catch (error) {
    console.error(
      "MULTIPLE PAGE UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to upload catalog pages",
      error:
        error instanceof Error
          ? error.message
          : error,
    });
  }
};



//get catalogPages

export const getCatalogPages = async (
  req: Request,
  res: Response
) => {
  try {
    const { catalogId } = req.params;

    const pages = await CatalogPage.find({
      catalogId,
    }).sort({ pageNumber: 1 });

    res.status(200).json({
      pages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get catalog pages",
      error,
    });
  }
};



// update catalog



export const updateCatalogPage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalogId = req.params.catalogId as string;

    const files = req.files as Express.Multer.File[];

    const pageIds = Array.isArray(req.body.pageIds)
      ? req.body.pageIds
      : [req.body.pageIds];

    const pageNumbers = Array.isArray(req.body.pageNumbers)
      ? req.body.pageNumbers
      : [req.body.pageNumbers];

    const categories = Array.isArray(req.body.categories)
      ? req.body.categories
      : [req.body.categories];

    const subcategories = Array.isArray(req.body.subcategories)
      ? req.body.subcategories
      : [req.body.subcategories];

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

      const page = await CatalogPage.findOne({
        _id: pageId,
        catalogId,
      });

      if (!page) {
        return res.status(404).json({
          message: `Catalog page not found: ${pageId}`,
        });
      }

      // Update basic information
      if (pageNumbers[i] !== undefined) {
        page.pageNumber = Number(pageNumbers[i]);
      }

      if (categories[i] !== undefined) {
        page.category = categories[i];
      }

      if (subcategories[i] !== undefined) {
        page.subcategory = subcategories[i];
      }

      // If new image is provided
      if (files && files[i]) {
        // Delete old image from Cloudinary
        if (page.publicId) {
          await cloudinary.uploader.destroy(page.publicId);
        }

        // Upload new image
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "catalog-pages",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) {
                reject(
                  error || new Error("Cloudinary upload failed")
                );
                return;
              }

              resolve(result);
            }
          );

          Readable.from(files[i].buffer).pipe(uploadStream);
        });

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
  } catch (error) {
    console.error("Update catalog pages error:", error);

    return res.status(500).json({
      message: "Failed to update catalog pages",
      error,
    });
  }
};
// DELETE PAGE

// DELETE PAGE
export const deleteCatalogPage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { pageId } = req.params;

    if (!pageId) {
      return res.status(400).json({
        message: "Page ID is required",
      });
    }

    const page = await CatalogPage.findById(pageId);

    if (!page) {
      return res.status(404).json({
        message: "Catalog page not found",
      });
    }

    // Delete image from Cloudinary
    if (page.publicId) {
      await cloudinary.uploader.destroy(
        page.publicId
      );
    }

    // Delete page from MongoDB
    await CatalogPage.findByIdAndDelete(pageId);

    return res.status(200).json({
      message: "Catalog page deleted successfully",
      deletedPage: pageId,
    });
  } catch (error) {
    console.error(
      "DELETE CATALOG PAGE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete catalog page",
      error:
        error instanceof Error
          ? error.message
          : error,
    });
  }
};