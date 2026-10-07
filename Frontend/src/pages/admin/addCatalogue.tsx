import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";
import { createCatalog } from "../../services/catalogService";

const AddCatalogue = () => {
  const navigate = useNavigate();
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (coverFile) fd.append("coverImage", coverFile);
      const catalog = await createCatalog(fd);
      navigate(`/admin/catalogues/${catalog._id}/pages`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/catalogues")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Catalogue</h1>
            <p className="text-sm text-muted-foreground">Create a new catalogue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Catalogue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title *</label>
                <Input
                  placeholder="e.g. Summer Collection 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <textarea
                  className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
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
                    onClick={() => { setCoverFile(null); setCoverPreview(""); }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Click to upload cover image</span>
                </button>
              )}
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/admin/catalogues")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Upload className="h-4 w-4" /> Create & Add Pages</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddCatalogue;
