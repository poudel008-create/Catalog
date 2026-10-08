import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import AdminLayout from "./layout";

import { useAuth } from "../../hooks/context/authContext";

import {
  fetchCatalogPages,
  uploadCatalogPage,
  deleteCatalogPage,
  type CatalogPage,
} from "../../services/catalogService";

const ManagePages = () => {
  const { catalogId } =
    useParams<{ catalogId: string }>();

  const navigate = useNavigate();

  const { accessToken } = useAuth();

  const fileRef =
    useRef<HTMLInputElement>(null);

  // =========================
  // STATE
  // =========================

  const [pages, setPages] =
    useState<CatalogPage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================
  // LOAD PAGES
  // =========================

  const loadPages = async () => {
    if (!catalogId) return;

    setLoading(true);

    console.log(
      "LOADING PAGES:",
      catalogId
    );

    try {
      const data =
        await fetchCatalogPages(
          catalogId
        );

      console.log(
        "PAGES RESPONSE:",
        data
      );

      setPages(data);

      setError("");
    } catch (error: any) {
      console.error(
        "PAGE LOAD ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to load pages"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadPages();
  }, [catalogId]);

const handleUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const files = Array.from(e.target.files ?? []);

  if (!files.length) return;

  if (!catalogId) {
    setError("Catalogue ID is missing");
    return;
  }

  if (!accessToken) {
    setError("Access token is missing");
    return;
  }

  setUploading(true);
  setError("");

  try {
    // =========================
    // CREATE ONE FORM DATA
    // =========================

    const formData = new FormData();

    // Add ALL selected images
    files.forEach((file) => {
      formData.append("pages", file);
    });

    console.log(
      "UPLOADING MULTIPLE PAGES:",
      files.length
    );

    // =========================
    // ONE API REQUEST
    // =========================

    await uploadCatalogPage(
      catalogId,
      formData,
      accessToken
    );

    console.log("ALL PAGES UPLOADED");

    // Reload pages after upload
    await loadPages();
  } catch (error: any) {
    console.error(
      "PAGE UPLOAD ERROR:",
      error
    );

    setError(
      error.message ||
        "Failed to upload pages"
    );
  } finally {
    setUploading(false);

    // Clear input
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }
};

  const handleDelete = async (
    pageId: string
  ) => {
    const confirmed = window.confirm(
      "Delete this page?"
    );

    if (!confirmed) return;

    if (!accessToken) {
      setError(
        "Access token is missing"
      );
      return;
    }

    try {
      setError("");

      await deleteCatalogPage(
        pageId,
        accessToken
      );

      /*
       * Reload after delete.
       */
      await loadPages();
    } catch (error: any) {
      console.error(
        "DELETE PAGE ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to delete page"
      );
    }
  };

  const sortedPages = [
    ...pages,
  ].sort(
    (a, b) =>
      a.pageNumber -
      b.pageNumber
  );

  return (
    <AdminLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() =>
                navigate(
                  "/admin/catalogues"
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>

              <h1 className="text-2xl font-bold">
                Manage Pages
              </h1>

              <p className="text-sm text-muted-foreground">
                {pages.length} page
                {pages.length !== 1
                  ? "s"
                  : ""}{" "}
                uploaded
              </p>

            </div>

          </div>

          {/* UPLOAD BUTTON */}

          <div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={
                handleUpload
              }
            />

            <Button
              type="button"
              onClick={() =>
                fileRef.current?.click()
              }
              disabled={uploading}
              className="gap-2"
            >

              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  Upload Pages
                </>
              )}

            </Button>

          </div>

        </div>


        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {[...Array(5)].map(
              (_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse rounded-xl bg-muted"
                />
              )
            )}

          </div>

        ) : pages.length === 0 ? (

          <Card>

            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">

              <ImagePlus className="h-12 w-12 text-muted-foreground" />

              <p className="text-center text-muted-foreground">
                No pages yet. Upload
                images to get started.
              </p>

              <Button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                disabled={uploading}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                Upload Pages
              </Button>

            </CardContent>

          </Card>

        ) : (

          /* =========================
             PAGE GRID
          ========================= */

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {sortedPages.map(
              (page) => (

                <div
                  key={page._id}
                  className="group relative overflow-hidden rounded-xl border bg-card"
                >

                  {/* PAGE IMAGE */}

                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="aspect-[3/4] w-full object-cover"
                  />

                  {/* HOVER CONTROLS */}

                  <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 transition group-hover:bg-black/30">

                    <div className="flex items-start justify-between opacity-0 transition group-hover:opacity-100">

                      {/* PAGE NUMBER */}

                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                        #{page.pageNumber}
                      </span>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            page._id
                          )
                        }
                        className="rounded-full bg-destructive/80 p-1 text-white hover:bg-destructive"
                        title="Delete page"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* PAGE NUMBER BOTTOM */}

                  <div className="border-t bg-card px-3 py-2 text-center text-sm font-medium">
                    Page{" "}
                    {page.pageNumber}
                  </div>

                </div>

              )
            )}

            {/* =========================
                ADD MORE
            ========================= */}

            <button
              type="button"
              onClick={() =>
                fileRef.current?.click()
              }
              disabled={uploading}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >

              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin" />

                  <span className="text-xs">
                    Uploading...
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" />

                  <span className="text-xs">
                    Add more pages
                  </span>
                </>
              )}

            </button>

          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManagePages;

