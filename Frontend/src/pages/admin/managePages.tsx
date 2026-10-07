import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ImagePlus, Trash2, Loader2, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";
import {
  fetchCatalogPages,
  uploadCatalogPage,
  deleteCatalogPage,
  type CatalogPage,
} from "../../services/catalogService";

const ManagePages = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!catalogId) return;
    try {
      const data = await fetchCatalogPages(catalogId);
      setPages(data);
    } catch {
      setError("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [catalogId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !catalogId) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("page", files[i]);
        fd.append("pageNumber", String(pages.length + i + 1));
        const page = await uploadCatalogPage(catalogId, fd);
        setPages((prev) => [...prev, page]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await deleteCatalogPage(pageId);
      setPages((prev) => prev.filter((p) => p._id !== pageId));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/catalogues")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Manage Pages</h1>
              <p className="text-sm text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><ImagePlus className="h-4 w-4" /> Upload Pages</>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <ImagePlus className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No pages yet. Upload images to get started.</p>
              <Button onClick={() => fileRef.current?.click()} className="gap-2">
                <ImagePlus className="h-4 w-4" /> Upload Pages
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {pages
              .sort((a, b) => a.pageNumber - b.pageNumber)
              .map((page) => (
                <div key={page._id} className="group relative overflow-hidden rounded-xl border bg-card">
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 transition group-hover:bg-black/30">
                    <div className="flex justify-between opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                        #{page.pageNumber}
                      </span>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="rounded-full bg-destructive/80 p-1 text-white hover:bg-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Upload more tile */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Add more</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManagePages;
