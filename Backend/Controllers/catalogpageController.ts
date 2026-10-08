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
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "At least one page image is required",
      });
    }

    const catalog = await Catalog.findById(catalogId);

    if (!catalog) {
      return res.status(404).json({
        message: "Catalog not found",
      });
    }

    // Existing pages count
    const existingPages = await CatalogPage.countDocuments({
      catalogId,
    });

    const uploadedPages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const page = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "catalog-pages",
            resource_type: "image",
          },
          async (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }

            try {
              const createdPage = await CatalogPage.create({
                catalogId,
                pageNumber: existingPages + i + 1,
                imageUrl: result.secure_url,
                publicId: result.public_id,
              });

              resolve(createdPage);
            } catch (dbError) {
              reject(dbError);
            }
          }
        );

        Readable.from(file.buffer).pipe(uploadStream);
      });

      uploadedPages.push(page);
    }

    return res.status(201).json({
      message: "Catalog pages uploaded successfully",
      pages: uploadedPages,
    });
  } catch (error) {
    console.error("MULTIPLE PAGE UPLOAD ERROR:", error);

    return res.status(500).json({
      message: "Failed to upload catalog pages",
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
    const { pageNumber } = req.body;

    const page = await CatalogPage.findByIdAndUpdate(
      pageId,
      {
        pageNumber: Number(pageNumber),
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