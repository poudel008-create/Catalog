const BASE = "http://localhost:5000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  subCategoryCount: number;
};

// GET ALL CATEGORIES
export const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${BASE}/categories`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch categories");
  }

  return data.categories ?? [];
};

// CREATE CATEGORY
export const createCategory = async (
  body: {
    name: string;
    description?: string;
  }
): Promise<Category> => {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create category");
  }

  return data.category;
};

// UPDATE CATEGORY
export const updateCategory = async (
  id: string,
  body: {
    name: string;
    description?: string;
  }
): Promise<Category> => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update category");
  }

  return data.category;
};

// DELETE CATEGORY
export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete category");
  }
};