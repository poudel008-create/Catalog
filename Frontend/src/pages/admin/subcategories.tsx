import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Layers3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const CATEGORIES = ["Electronics", "Clothing", "Home & Garden"];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const AdminSubCategories = () => {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubCategory[]>([
    { id: "1", name: "Smartphones", slug: "smartphones", category: "Electronics" },
    { id: "2", name: "Laptops", slug: "laptops", category: "Electronics" },
    { id: "3", name: "Men's Wear", slug: "mens-wear", category: "Clothing" },
  ]);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    setSubs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        slug: slugify(newName),
        category: newCategory,
      },
    ]);
    setNewName("");
  };

  const handleDelete = (id: string) => setSubs((prev) => prev.filter((s) => s.id !== id));

  const startEdit = (sub: SubCategory) => { setEditId(sub.id); setEditName(sub.name); };

  const confirmEdit = () => {
    if (!editName.trim() || !editId) return;
    setSubs((prev) =>
      prev.map((s) =>
        s.id === editId ? { ...s, name: editName.trim(), slug: slugify(editName) } : s
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
            <h1 className="text-2xl font-bold">Sub-Categories</h1>
            <p className="text-sm text-muted-foreground">
              {subs.length} sub-categor{subs.length !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>

        {/* Add */}
        <Card>
          <CardHeader>
            <CardTitle>Add Sub-Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Parent Category</label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Sub-category name"
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
            <CardTitle>All Sub-Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Layers3 className="h-8 w-8" />
                <p className="text-sm">No sub-categories yet</p>
              </div>
            ) : (
              subs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  {editId === sub.id ? (
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
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.category} · /{sub.slug}
                      </p>
                    </div>
                  )}

                  <div className="flex shrink-0 gap-1">
                    {editId === sub.id ? (
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
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(sub)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => handleDelete(sub.id)}
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

export default AdminSubCategories;
