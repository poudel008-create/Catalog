import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {ArrowLeft,  Plus,  Pencil, Trash2, FolderTree, Check, X,} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";
import { useAuth } from "../../hooks/context/authContext";
import {fetchCategories, createCategory, updateCategory, deleteCategory,
  type Category,
} from "@/services/categoryService";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const AdminCategories = () => {
  const navigate = useNavigate();
  const {accessToken}=useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchCategories();

        console.log("CATEGORIES FOR ADMIN:", data);

        setCategories(data);
      } catch (error: any) {
        console.error("CATEGORY LOAD ERROR:", error);

        setError(error.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    try {
      setError("");

      const category = await createCategory({
        name: newName.trim(),
      }, accessToken!);

      setCategories((prev) => [...prev, category]);

      setNewName("");
    } catch (error: any) {
      console.error("CATEGORY CREATE ERROR:", error);

      setError(error.message || "Failed to create category");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError("");

      await deleteCategory(id, accessToken);

      setCategories((prev) =>
        prev.filter((category) => category._id !== id)
      );
    } catch (error: any) {
      console.error("CATEGORY DELETE ERROR:", error);

      setError(error.message || "Failed to delete category");
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat._id);
    setEditName(cat.name);
  };

  const confirmEdit = async () => {
    if (!editName.trim() || !editId) return;

    try {
      setError("");

      const updatedCategory = await updateCategory(editId, {
        name: editName.trim(),
      }, accessToken!);

      setCategories((prev) =>
        prev.map((category) =>
          category._id === editId ? updatedCategory : category
        )
      );

      setEditId(null);
      setEditName("");
    } catch (error: any) {
      console.error("CATEGORY UPDATE ERROR:", error);

      setError(error.message || "Failed to update category");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold">Categories</h1>

            <p className="text-sm text-muted-foreground">
              {categories.length} categor
              {categories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>

        {/* Add */}
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  }
                }}
              />

              <Button
                onClick={handleAdd}
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <FolderTree className="h-8 w-8" />

                <p className="text-sm">
                  No categories yet
                </p>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  {/* Category information / Edit input */}
                  {editId === cat._id ? (
                    <Input
                      className="mr-2 h-7"
                      value={editName}
                      onChange={(e) =>
                        setEditName(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          confirmEdit();
                        }

                        if (e.key === "Escape") {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="font-medium">
                        {cat.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        /{cat.slug}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1">
                    {editId === cat._id ? (
                      <>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={confirmEdit}
                        >
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(cat)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() =>
                            handleDelete(cat._id)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;