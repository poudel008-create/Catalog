import BASE from "../config/api";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  subCategoryCount: number;
}

const authHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

export const createCategory = async (
  body: {
    name: string;
    description?: string;
  },
  accessToken: string
): Promise<Category> => {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create category");
  }

  return data.category;
};

export const updateCategory = async (
  id: string,
  body: {
    name: string;
    description?: string;
  },
  accessToken: string
): Promise<Category> => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update category");
  }

  return data.category;
};

export const deleteCategory = async (
  id: string,
  accessToken: string
): Promise<void> => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete category");
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${BASE}/categories`);

  console.log("CATEGORY API STATUS:", res.status);

  const data = await res.json();

  console.log("CATEGORY API DATA:", data);

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch categories");
  }

  return data.categories ?? [];
};

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  category:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
      };
}

export const fetchSubCategories = async (
  categoryId?: string
): Promise<SubCategory[]> => {
  const url = categoryId
    ? `${BASE}/subcategories?category=${categoryId}`
    : `${BASE}/subcategories`;

  const res = await fetch(url);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch sub-categories");
  }

  return data.subCategories ?? [];
};