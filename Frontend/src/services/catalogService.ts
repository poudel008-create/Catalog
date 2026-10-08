const BASE = "http://localhost:5000/api";

const authHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

// ==================== Catalogs ====================

export interface Catalog {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
}

export const fetchCatalogs = async (
  accessToken: string
): Promise<Catalog[]> => {
  console.log("CATALOG SERVICE TOKEN:", accessToken);
  console.log("TOKEN EXISTS:", !!accessToken);

  const res = await fetch(`${BASE}/catalogs`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  const data = await res.json();

  console.log("CATALOG STATUS:", res.status);
  console.log("CATALOG RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch catalogs");
  }

  return data.catalogs ?? [];
};

export const createCatalog = async (
  formData: FormData,
  accessToken: string
): Promise<Catalog> => {
  console.log("CREATE CATALOG TOKEN:", accessToken);
  console.log("TOKEN EXISTS:", !!accessToken);

  const res = await fetch(`${BASE}/catalogs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await res.json();

  console.log("CREATE CATALOG STATUS:", res.status);
  console.log("CREATE CATALOG RESPONSE:", data);

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to create catalog"
    );
  }

  return data.catalog;
};

export const deleteCatalog = async (
  id: string,
  accessToken: string
): Promise<void> => {
  const res = await fetch(`${BASE}/catalogs/${id}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete catalog");
  }
};

// ==================== Catalog Pages ====================

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

  const res = await fetch(`${BASE}/catalog-pages/${catalogId}`);

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
  formData: FormData,
  accessToken: string
): Promise<CatalogPage[]> => {
  console.log("TOKEN EXISTS:", !!accessToken);
  console.log("TOKEN LENGTH:", accessToken?.length);

  const res = await fetch(
    `${BASE}/catalog-pages/${catalogId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  console.log("UPLOAD STATUS:", res.status);

  const data = await res.json();

  console.log("UPLOAD RESPONSE:", data);

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to upload pages"
    );
  }

  return data.pages ?? [];
};

export const deleteCatalogPage = async (
  pageId: string,
  accessToken: string
): Promise<void> => {
  const res = await fetch(
    `${BASE}/catalog-pages/page/${pageId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    }
  );

  if (!res.ok) {
    const data = await res.json();

    throw new Error(
      data.message || "Failed to delete page"
    );
  }
};

// Public
export const fetchPublishedCatalogs = async (): Promise<Catalog[]> => {
  const res = await fetch(`${BASE}/catalogs/public`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to fetch published catalogs"
    );
  }

  return data.catalogs ?? [];
};

export const fetchCatalogById = async (
  id: string,
  accessToken: string
): Promise<Catalog> => {
  const res = await fetch(`${BASE}/catalogs/${id}`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to fetch catalog"
    );
  }

  return data.catalog;
};


export const updateCatalog = async (
  id: string,
  formData: FormData,
  accessToken: string
): Promise<Catalog> => {
  const res = await fetch(`${BASE}/catalogs/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to update catalog"
    );
  }

  return data.catalog;
};