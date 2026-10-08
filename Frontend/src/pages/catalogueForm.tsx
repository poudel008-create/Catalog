import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Upload,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  fetchCategories,
  fetchSubCategories,
  type Category,
  type SubCategory,
} from "../services/categoryService"

export interface CatalogueFormData {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  coverImage: File | null;
}

interface CatalogueFormProps {
  mode: "add" | "edit";

  initialData?: {
    title?: string;
    description?: string;
    category?: string;
    subCategory?: string;
    coverImage?: string;
  };

  loading?: boolean;
  error?: string;

  onSubmit: (data: CatalogueFormData) => Promise<void> | void;
  onCancel: () => void;
}

const CatalogueForm = ({
  mode,
  initialData,
  loading = false,
  error = "",
  onSubmit,
  onCancel,
}: CatalogueFormProps) => {
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(
    initialData?.title || ""
  );

  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [subCategories, setSubCategories] = useState<
    SubCategory[]
  >([]);

  const [categoryId, setCategoryId] = useState(
    initialData?.category || ""
  );

  const [subCategoryId, setSubCategoryId] = useState(
    initialData?.subCategory || ""
  );

  const [coverFile, setCoverFile] = useState<File | null>(
    null
  );

  const [coverPreview, setCoverPreview] = useState(
    initialData?.coverImage || ""
  );

  const [loadingSubCategories, setLoadingSubCategories] =
    useState(false);

  const [formError, setFormError] = useState("");

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error: any) {
        setFormError(
          error.message || "Failed to load categories"
        );
      }
    };

    loadCategories();
  }, []);

  // Load sub-categories
  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }

    const loadSubCategories = async () => {
      setLoadingSubCategories(true);

      try {
        const data = await fetchSubCategories(categoryId);

        setSubCategories(data);

        // Only clear sub-category when user changes category
        if (
          initialData?.category !== categoryId
        ) {
          setSubCategoryId("");
        }
      } catch (error: any) {
        setFormError(
          error.message ||
            "Failed to load sub-categories"
        );
      } finally {
        setLoadingSubCategories(false);
      }
    };

    loadSubCategories();
  }, [categoryId]);

  const handleCoverChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setCoverFile(file);

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const removeCover = () => {
    setCoverFile(null);

    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverPreview("");

    if (coverRef.current) {
      coverRef.current.value = "";
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFormError("");

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    if (!subCategoryId) {
      setFormError("Please select a sub-category");
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      subCategory: subCategoryId,
      coverImage: coverFile,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold">
            {mode === "add"
              ? "Add Catalogue"
              : "Edit Catalogue"}
          </h1>

          <p className="text-sm text-muted-foreground">
            {mode === "add"
              ? "Create a new catalogue"
              : "Update catalogue information"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* Catalogue Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              Catalogue Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Title *
              </label>

              <Input
                placeholder="e.g. Summer Collection 2025"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>

              <textarea
                className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Optional description..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Category *
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Sub-category *
              </label>

              <select
                value={subCategoryId}
                onChange={(e) =>
                  setSubCategoryId(e.target.value)
                }
                disabled={
                  !categoryId ||
                  loadingSubCategories
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {loadingSubCategories
                    ? "Loading sub-categories..."
                    : !categoryId
                    ? "Select category first"
                    : subCategories.length === 0
                    ? "No sub-categories available"
                    : "Select sub-category"}
                </option>

                {subCategories.map(
                  (subCategory) => (
                    <option
                      key={subCategory._id}
                      value={subCategory._id}
                    >
                      {subCategory.name}
                    </option>
                  )
                )}
              </select>
            </div>

          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>
              Cover Image
            </CardTitle>
          </CardHeader>

          <CardContent>

            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />

            {coverPreview ? (
              <div className="relative">

                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-48 w-full rounded-lg object-cover"
                />

                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>

              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  coverRef.current?.click()
                }
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-8 w-8" />

                <span className="text-sm">
                  Click to upload cover image
                </span>
              </button>
            )}

          </CardContent>
        </Card>

        {/* Error */}
        {(formError || error) && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {formError || error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">

          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {mode === "add"
                  ? "Creating..."
                  : "Updating..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />

                {mode === "add"
                  ? "Create & Add Pages"
                  : "Update Catalogue"}
              </>
            )}
          </Button>

        </div>

      </form>
    </div>
  );
};

export default CatalogueForm;
