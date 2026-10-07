const BASE = "http://localhost:5000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

// ── Catalogs ──────────────────────────────────────────────
export interface Catalog {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
}

export const fetchCatalogs = async (): Promise<Catalog[]> => {
  const res = await fetch(`${BASE}/catalogs`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch catalogs");
  }

  return data.catalogs ?? [];
};
export const createCatalog = async (formData: FormData): Promise<Catalog> => {
  const res = await fetch(`${BASE}/catalogs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create catalog");
  return data.catalog;
};

export const updateCatalog = async (
  id: string,
  body: Partial<Pick<Catalog, "title" | "description" | "published">>
): Promise<Catalog> => {
  const res = await fetch(`${BASE}/catalogs/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update catalog");
  return data.catalog;
};

export const deleteCatalog = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/catalogs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete catalog");
  }
};

// ── Catalog Pages ─────────────────────────────────────────
export interface CatalogPage {
  _id: string;
  catalogId: string;
  pageNumber: number;
  imageUrl: string;
  publicId: string;
}

export const fetchCatalogPages = async (
  catalogId: string
): Promise<CatalogPage[]> => {
  console.log("FETCHING:", `${BASE}/catalog-pages/${catalogId}`);

  const res = await fetch(
    `${BASE}/catalog-pages/${catalogId}`
  );

  console.log("STATUS:", res.status);

  const data = await res.json();

  console.log("DATA:", data);

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to fetch catalog pages"
    );
  }

  return data.pages ?? [];
};

export const uploadCatalogPage = async (
  catalogId: string,
  formData: FormData
): Promise<CatalogPage> => {
  const token = localStorage.getItem("accessToken");

  console.log("TOKEN EXISTS:", !!token);
  console.log("TOKEN LENGTH:", token?.length);

  const res = await fetch(`${BASE}/catalog-pages/${catalogId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  console.log("UPLOAD STATUS:", res.status);

  const data = await res.json();

  console.log("UPLOAD RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data.message || "Failed to upload page");
  }

  return data.page;
};

export const deleteCatalogPage = async (pageId: string): Promise<void> => {
  const res = await fetch(`${BASE}/catalog-pages/page/${pageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete page");
  }
};
