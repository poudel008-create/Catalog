import { Request, Response } from "express";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary";
import Catalog from "../Models/catalogModel";
import { AuthRequest } from "../middleware/authMiddleware";

// CREATE CATALOG
export const createCatalog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { title, description, category, subCategory  } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Catalog title is required",
      });
    }

    let coverImage = "";

    // Upload cover image if provided
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "catalog-covers",
          resource_type: "image",
        },
        async (error, result) => {
          if (error || !result) {
            return res.status(500).json({
              message: "Cloudinary upload failed",
            });
          }

          const catalog = await Catalog.create({
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
        }
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
      return;
    }

    // Create catalog without cover image
    const catalog = await Catalog.create({
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
  } catch (error) {
    console.error("CREATE CATALOG ERROR:", error);

    res.status(500).json({
      message: "Failed to create catalog",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// GET ALL CATALOGS
export const getCatalogs = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalogs = await Catalog.find().sort({ createdAt: -1 });

    res.status(200).json({
      catalogs,
    });
  } catch (error) {
    console.error("GET CATALOGS ERROR:", error);

    res.status(500).json({
      message: "Failed to get catalogs",
      error: error instanceof Error ? error.message : error,
    });
  }
};
// GET SINGLE CATALOG
export const getCatalog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalog = await Catalog.findById(req.params.id);

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    res.status(200).json({
      catalog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get catalog",
      error,
    });
  }
};

// UPDATE CATALOG
export const updateCatalog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { title, description, published } = req.body;

    const catalog = await Catalog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        published,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    res.status(200).json({
      message: "Catalog updated successfully",
      catalog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update catalog",
      error,
    });
  }
};

// DELETE CATALOG
export const deleteCatalog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const catalog = await Catalog.findByIdAndDelete(
      req.params.id
    );

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    res.status(200).json({
      message: "Catalog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete catalog",
      error,
    });
  }
};

export const getPublishedCatalogs = async (
  req: Request,
  res: Response
) => {
  try {
    const catalogs = await Catalog.find({
      published: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      catalogs,
    });
  } catch (error) {
    console.error("GET PUBLISHED CATALOGS ERROR:", error);

    res.status(500).json({
      message: "Failed to get published catalogs",
      error: error instanceof Error ? error.message : error,
    });
  }
};