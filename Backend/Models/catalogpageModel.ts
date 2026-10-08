import mongoose, { Document, Schema } from "mongoose";

export interface ICatalogPage extends Document {
  catalogId: mongoose.Types.ObjectId;
  pageNumber: number;
  category?: string;
  subcategory?: string;
  imageUrl: string;
  publicId: string;
}

const catalogPageSchema = new Schema<ICatalogPage>(
  {
    catalogId: {
      type: Schema.Types.ObjectId,
      ref: "Catalog",
      required: true,
    },

    pageNumber: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["bathroom", "kitchen", "living-room", "outdoor"]
    },
    subcategory: {
      type: String,
      enum: ["wall-tile", "floor-tile", "vitrified", "ceramic"]
    },

    imageUrl: {
      type: String,
      required: true,
    },


    publicId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CatalogPage = mongoose.model<ICatalogPage>(
  "CatalogPage",
  catalogPageSchema
);

export default CatalogPage;