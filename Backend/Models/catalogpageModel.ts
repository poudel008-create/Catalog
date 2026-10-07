import mongoose, { Document, Schema } from "mongoose";

export interface ICatalogPage extends Document {
  catalogId: mongoose.Types.ObjectId;
  pageNumber: number;
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