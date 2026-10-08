import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Layers3,
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import AdminLayout from "./layout";

import { useAuth } from "../../hooks/context/authContext";

import {
  fetchCategories,
  type Category,
} from "../../services/categoryService";

import {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  type SubCategory,
} from "../../services/subCategoryService";

const AdminSubCategories = () => {
  const navigate = useNavigate();

  const { accessToken } = useAuth();

  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Load categories + sub-categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoryData, subCategoryData] = await Promise.all([
          fetchCategories(),
          fetchSubCategories(),
        ]);

        console.log("CATEGORIES:", categoryData);
        console.log("SUB-CATEGORIES:", subCategoryData);

        setCategories(categoryData);
        setSubs(subCategoryData);

        // Select first category by default
        if (categoryData.length > 0) {
          setNewCategory(categoryData[0]._id);
        }
      } catch (error: any) {
        console.error("SUB-CATEGORY LOAD ERROR:", error);

        setError(
          error.message || "Failed to load sub-categories"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ADD
  const handleAdd = async () => {
    if (!newName.trim()) return;

    if (!newCategory) {
      setError("Please select a parent category");
      return;
    }

    if (!accessToken) {
      setError("You are not authenticated");
      return;
    }

    try {
      setError("");

      const newSubCategory = await createSubCategory(
        {
          name: newName.trim(),
          category: newCategory,
        },
        accessToken
      );

      setSubs((prev) => [...prev, newSubCategory]);

      setNewName("");
    } catch (error: any) {
      console.error("SUB-CATEGORY CREATE ERROR:", error);

      setError(
        error.message || "Failed to create sub-category"
      );
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!accessToken) {
      setError("You are not authenticated");
      return;
    }

    if (!confirm("Delete this sub-category?")) return;

    try {
      setError("");

      await deleteSubCategory(id, accessToken);

      setSubs((prev) =>
        prev.filter((sub) => sub._id !== id)
      );
    } catch (error: any) {
      console.error("SUB-CATEGORY DELETE ERROR:", error);

      setError(
        error.message || "Failed to delete sub-category"
      );
    }
  };

  // START EDIT
  const startEdit = (sub: SubCategory) => {
    setEditId(sub._id);
    setEditName(sub.name);
  };

  // CONFIRM EDIT
  const confirmEdit = async () => {
    if (!editName.trim() || !editId) return;

    if (!accessToken) {
      setError("You are not authenticated");
      return;
    }

    const currentSub = subs.find(
      (sub) => sub._id === editId
    );

    if (!currentSub) return;

    try {
      setError("");

      const updatedSubCategory =
        await updateSubCategory(
          editId,
          {
            name: editName.trim(),
            category: currentSub.category._id,
          },
          accessToken
        );

      setSubs((prev) =>
        prev.map((sub) =>
          sub._id === editId
            ? updatedSubCategory
            : sub
        )
      );

      setEditId(null);
      setEditName("");
    } catch (error: any) {
      console.error("SUB-CATEGORY UPDATE ERROR:", error);

      setError(
        error.message || "Failed to update sub-category"
      );
    }
  };

  // CANCEL EDIT
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
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold">
              Sub-Categories
            </h1>

            <p className="text-sm text-muted-foreground">
              {subs.length} sub-categor
              {subs.length !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Add */}
        <Card>
          <CardHeader>
            <CardTitle>
              Add Sub-Category
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Parent Category
              </label>

              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value)
                }
                disabled={loading}
              >
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

            <div className="flex gap-2">
              <Input
                placeholder="Sub-category name"
                value={newName}
                onChange={(e) =>
                  setNewName(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAdd()
                }
              />

              <Button
                onClick={handleAdd}
                className="gap-2 shrink-0"
                disabled={!accessToken}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Sub-Categories
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">

            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading sub-categories...
              </div>
            ) : subs.length === 0 ? (

              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Layers3 className="h-8 w-8" />
                <p className="text-sm">
                  No sub-categories yet
                </p>
              </div>

            ) : (

              subs.map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >

                  {editId === sub._id ? (

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
                        {sub.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {sub.category.name} · /{sub.slug}
                      </p>
                    </div>

                  )}

                  <div className="flex shrink-0 gap-1">

                    {editId === sub._id ? (

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
                          onClick={() =>
                            startEdit(sub)
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() =>
                            handleDelete(sub._id)
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

export default AdminSubCategories;