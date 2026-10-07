import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, FolderTree, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const AdminCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Electronics", slug: "electronics" },
    { id: "2", name: "Clothing", slug: "clothing" },
    { id: "3", name: "Home & Garden", slug: "home-garden" },
  ]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newName.trim(), slug: slugify(newName) },
    ]);
    setNewName("");
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
  };

  const confirmEdit = () => {
    if (!editName.trim() || !editId) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editId ? { ...c, name: editName.trim(), slug: slugify(editName) } : c
      )
    );
    setEditId(null);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
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
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <FolderTree className="h-8 w-8" />
                <p className="text-sm">No categories yet</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  {editId === cat.id ? (
                    <Input
                      className="mr-2 h-7"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") setEditId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    </div>
                  )}

                  <div className="flex shrink-0 gap-1">
                    {editId === cat.id ? (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={confirmEdit}>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(cat)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => handleDelete(cat.id)}
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
