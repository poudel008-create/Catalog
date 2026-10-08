import mongoose, { Document, Schema } from "mongoose";

export interface ICatalog extends Document {
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  subCategory?: string;
  published: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const catalogSchema = new Schema<ICatalog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },
  

    coverImage: {
      type: String,
    },

    published: {
      type: Boolean,
      default: false,
    },
    category: {
  type: Schema.Types.ObjectId,
  ref: "Category",
  required: true,
},

subCategory: {
  type: Schema.Types.ObjectId,
  ref: "SubCategory",
  required: true,
},

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Catalog = mongoose.model<ICatalog>("Catalog", catalogSchema);

export default Catalog;