import { Request, Response } from "express";
import { Readable } from "stream";

import CatalogPage from "../Models/catalogpageModel";
import Catalog from "../Models/catalogModel";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/authMiddleware";


const uploadToCloudinary = (buffer: Buffer) =>
  new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "catalog-pages", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });

const toArray = (value: any): any[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

// delete pachi gap hatauna renumber
const renumberPages = async (catalogId: string) => {
  const pages = await CatalogPage.find({ catalogId }).sort({ pageNumber: 1 });

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
    await CatalogPage.bulkWrite(ops);
  }
};

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
      const allPages = await CatalogPage.find({ catalogId });

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
      if (pageNumbers[i] !== undefined && pageNumbers[i] !== "") {
        const newNumber = Number(pageNumbers[i]);

        if (!Number.isInteger(newNumber) || newNumber < 1) {
          return res.status(400).json({
            message: "Page number must be a positive whole number",
          });
        }

        const oldNumber = page.pageNumber;

        if (newNumber !== oldNumber) {
          const other = allPages.find(
            (p) =>
              p.pageNumber === newNumber &&
              p._id.toString() !== page._id.toString()
          );

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
          await cloudinary.uploader.destroy(page.publicId);
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

    const catalogId = page.catalogId.toString();
    // Delete image from Cloudinary
    if (page.publicId) {
      await cloudinary.uploader.destroy(
        page.publicId
      );
    }

    // Delete page from MongoDB
    await CatalogPage.findByIdAndDelete(pageId);
    await renumberPages(catalogId);

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

// DELETE MULTIPLE
export const deleteMultipleCatalogPages = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalogId = req.params.catalogId as string;
    const pageIds: string[] = toArray(req.body.pageIds);

    if (pageIds.length === 0) {
      return res.status(400).json({
        message: "At least one page ID is required",
      });
    }

    const pages = await CatalogPage.find({
      _id: { $in: pageIds },
      catalogId,
    });

    if (pages.length === 0) {
      return res.status(404).json({ message: "No pages found" });
    }

    await Promise.all(
      pages
        .filter((p) => p.publicId)
        .map((p) => cloudinary.uploader.destroy(p.publicId as string))
    );

    await CatalogPage.deleteMany({
      _id: { $in: pages.map((p) => p._id) },
    });

    await renumberPages(catalogId);

    return res.status(200).json({
      message: `${pages.length} page(s) deleted successfully`,
      deletedPages: pages.map((p) => p._id),
    });
  } catch (error) {
    console.error("BULK DELETE ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete pages",
      error: error instanceof Error ? error.message : error,
    });
  }
};