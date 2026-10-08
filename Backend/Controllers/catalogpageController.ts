import { Request, Response } from "express";
import { Readable } from "stream";

import CatalogPage from "../Models/catalogpageModel";
import Catalog from "../Models/catalogModel";
import cloudinary from "../config/cloudinary";

export const uploadCatalogPage = async (
  req: Request,
  res: Response
) => {
  try {
    const catalogId = req.params.catalogId as string;
    const { pageNumber,category,subcategory } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Page image is required",
      });
    }

    const catalog = await Catalog.findById(catalogId);

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "catalog-pages",
        resource_type: "image",
      },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({
            message: "Cloudinary upload failed",
            error,
          });
        }

        const page = await CatalogPage.create({
          catalogId,
          pageNumber: Number(pageNumber),
          category,
          subcategory,
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });

        return res.status(201).json({
          message: "Catalog page uploaded successfully",
          page,
        });
      }
    );

    Readable.from(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload catalog page",
      error,
    });
  }
};

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



// UPDATE / REORDER PAGE
export const updateCatalogPage = async (
  req: Request,
  res: Response
) => {
  try {
    const pageId = req.params.id as string;
    const { pageNumber,category,subcategory } = req.body;

    const page = await CatalogPage.findByIdAndUpdate(
      pageId,
      {
        pageNumber: Number(pageNumber),
        category,
        subcategory,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!page) {
      return res.status(404).json({
        message: "Catalog page not found",
      });
    }

    res.status(200).json({
      message: "Page updated successfully",
      page,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update page",
      error,
    });
  }
};

// DELETE PAGE
export const deleteCatalogPage = async (
  req: Request,
  res: Response
) => {
  try {
    const pageId = req.params.id as string;

    const page = await CatalogPage.findById(pageId);

    if (!page) {
      return res.status(404).json({
        message: "Catalog page not found",
      });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(page.publicId);

    // Delete page from MongoDB
    await CatalogPage.findByIdAndDelete(pageId);

    res.status(200).json({
      message: "Catalog page deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete catalog page",
      error,
    });
  }
};