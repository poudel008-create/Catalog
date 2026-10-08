import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Trash2,
  Loader2,
  Pencil,
  X,
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
  updateCatalogPage,
  deleteMultipleCatalogPages,
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

  // Select mode state
  const [selectMode, setSelectMode] =
    useState(false);
  const [selected, setSelected] =
    useState<string[]>([]);
  const [deleting, setDeleting] =
    useState(false);

  // Edit modal state
  const [editingPage, setEditingPage] =
    useState<CatalogPage | null>(null);
  const [editPageNumber, setEditPageNumber] =
    useState<number | string>("");
  const [editFile, setEditFile] =
    useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] =
    useState<string | null>(null);
  const [savingEdit, setSavingEdit] =
    useState(false);
  const editFileInputRef =
    useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    return () => {
      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl);
      }
    };
  }, [editPreviewUrl]);

  const handleOpenEdit = (page: CatalogPage) => {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditingPage(page);
    setEditPageNumber(page.pageNumber);
    setEditFile(null);
    setEditPreviewUrl(null);
  };

  const handleCloseEdit = () => {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditingPage(null);
    setEditFile(null);
    setEditPreviewUrl(null);
    setEditPageNumber("");
  };

  const handleEditFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl);
      }
      const preview = URL.createObjectURL(file);
      setEditFile(file);
      setEditPreviewUrl(preview);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPage || !catalogId) return;

    const parsedNumber = Number(editPageNumber);
    if (!parsedNumber || !Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      setError("Page number must be a positive integer");
      return;
    }

    if (!accessToken) {
      setError("Access token is missing");
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      await updateCatalogPage(
        catalogId,
        {
          pageId: editingPage._id,
          pageNumber: parsedNumber,
          file: editFile,
        },
        accessToken
      );

      handleCloseEdit();
      await loadPages();
    } catch (error: any) {
      console.error("UPDATE PAGE ERROR:", error);
      setError(
        error.message || "Failed to update page"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selected.length === pages.length) {
      setSelected([]);
    } else {
      setSelected(pages.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !catalogId) return;

    const confirmed = window.confirm(
      `Delete ${selected.length} selected page${
        selected.length > 1 ? "s" : ""
      }?`
    );

    if (!confirmed) return;

    if (!accessToken) {
      setError("Access token is missing");
      return;
    }

    setDeleting(true);

    try {
      setError("");

      await deleteMultipleCatalogPages(
        catalogId,
        selected,
        accessToken
      );

      setSelected([]);
      setSelectMode(false);
      await loadPages();
    } catch (error: any) {
      console.error(
        "BULK DELETE ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to delete pages"
      );
    } finally {
      setDeleting(false);
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

          <div className="flex items-center gap-2">

            {pages.length > 0 && (
              <>
                {selectMode && (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleToggleSelectAll}
                    >
                      {selected.length === pages.length
                        ? "Unselect all"
                        : "Select all"}
                    </Button>

                    <Button
                      variant="destructive"
                      type="button"
                      disabled={selected.length === 0 || deleting}
                      onClick={handleBulkDelete}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Deleting...
                        </>
                      ) : (
                        `Delete (${selected.length})`
                      )}
                    </Button>
                  </>
                )}

                <Button
                  variant={selectMode ? "secondary" : "outline"}
                  type="button"
                  onClick={() => {
                    setSelectMode((prev) => !prev);
                    setSelected([]);
                  }}
                >
                  {selectMode ? "Cancel" : "Select"}
                </Button>
              </>
            )}

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
                  onClick={() => {
                    if (selectMode) {
                      setSelected((prev) =>
                        prev.includes(page._id)
                          ? prev.filter((id) => id !== page._id)
                          : [...prev, page._id]
                      );
                    }
                  }}
                  className={`group relative overflow-hidden rounded-xl border bg-card ${
                    selectMode ? "cursor-pointer" : ""
                  } ${
                    selected.includes(page._id) ? "ring-2 ring-primary" : ""
                  }`}
                >

                  {/* SELECT CHECKBOX */}
                  {selectMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selected.includes(page._id)}
                        readOnly
                        className="h-4 w-4 rounded pointer-events-none accent-primary"
                      />
                    </div>
                  )}

                  {/* PAGE IMAGE */}

                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="aspect-[3/4] w-full object-cover"
                  />

                  {/* HOVER CONTROLS */}

                  {!selectMode && (
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 transition group-hover:bg-black/30">

                      <div className="flex items-start justify-between opacity-0 transition group-hover:opacity-100">

                        {/* PAGE NUMBER */}

                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                          #{page.pageNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(page);
                            }}
                            className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                            title="Edit page"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(
                                page._id
                              );
                            }}
                            className="rounded-full bg-destructive/80 p-1 text-white hover:bg-destructive"
                            title="Delete page"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* PAGE NUMBER BOTTOM */}

                  <div className="border-t bg-card px-3 py-2 text-center text-sm font-medium">
                    <div>
                      Page{" "}
                      {page.pageNumber}
                    </div>
                  </div>

                </div>

              )
            )}

            {/* =========================
                ADD MORE
            ========================= */}

            {!selectMode && (
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
            )}

          </div>
        )}

        {/* =========================
            EDIT MODAL
        ========================= */}
        {editingPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md bg-card shadow-lg">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-semibold">
                    Edit Page #{editingPage.pageNumber}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={savingEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* IMAGE PREVIEW */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative aspect-[3/4] w-36 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={editPreviewUrl || editingPage.imageUrl}
                      alt={`Page ${editingPage.pageNumber}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditFileChange}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={savingEdit}
                  >
                    Replace image
                  </Button>
                </div>

                {/* PAGE NUMBER */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Page Number</label>
                  <input
                    type="number"
                    min={1}
                    value={editPageNumber}
                    onChange={(e) =>
                      setEditPageNumber(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Page numbers swap if the number is already used.
                  </p>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseEdit}
                    disabled={savingEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="gap-2"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManagePages;