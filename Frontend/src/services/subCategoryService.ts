const BASE = "https://catalog-jti1.onrender.com/api";

const authHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  category: {
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

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch sub-categories"
    );
  }

  return data.subCategories ?? [];
};

export const createSubCategory = async (
  body: {
    name: string;
    category: string;
  },
  accessToken: string
): Promise<SubCategory> => {
  const response = await fetch(`${BASE}/subcategories`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create sub-category"
    );
  }

  return data.subCategory;
};

export const updateSubCategory = async (
  id: string,
  body: {
    name: string;
    category: string;
  },
  accessToken: string
): Promise<SubCategory> => {
  const response = await fetch(
    `${BASE}/subcategories/${id}`,
    {
      method: "PUT",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update sub-category"
    );
  }

  return data.subCategory;
};

export const deleteSubCategory = async (
  id: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${BASE}/subcategories/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    }
  );

  if (!response.ok) {
    const data = await response.json();

    throw new Error(
      data.message || "Failed to delete sub-category"
    );
  }
};