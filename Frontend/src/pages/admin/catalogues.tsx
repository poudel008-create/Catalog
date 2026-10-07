import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, Eye, EyeOff, ArrowLeft, Pencil, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "./layout";
import {
  fetchCatalogs,
  deleteCatalog,
  updateCatalog,
  type Catalog,
} from "../../services/catalogService";

const AdminCatalogues = () => {
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCatalogs()
      .then(setCatalogs)
      .catch(() => setError("Failed to load catalogues"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this catalogue and all its pages?")) return;
    try {
      await deleteCatalog(id);
      setCatalogs((prev) => prev.filter((c) => c._id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePublish = async (cat: Catalog) => {
    try {
      const updated = await updateCatalog(cat._id, { published: !cat.published });
      setCatalogs((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Catalogues</h1>
              <p className="text-sm text-muted-foreground">Manage all your catalogues</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/catalogues/add")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Catalogue
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : catalogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No catalogues yet</p>
              <Button onClick={() => navigate("/admin/catalogues/add")} className="gap-2">
                <Plus className="h-4 w-4" /> Add Catalogue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((cat) => (
              <Card key={cat._id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {cat.coverImage ? (
                    <img
                      src={cat.coverImage}
                      alt={cat.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.published
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {cat.published ? "Published" : "Draft"}
                  </span>
                </div>

                <CardContent className="space-y-3 pt-4">
                  <div>
                    <h3 className="font-semibold leading-tight">{cat.title}</h3>
                    {cat.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => navigate(`/admin/catalogues/${cat._id}/pages`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Manage Pages
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleTogglePublish(cat)}
                      title={cat.published ? "Unpublish" : "Publish"}
                    >
                      {cat.published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleDelete(cat._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCatalogues;
