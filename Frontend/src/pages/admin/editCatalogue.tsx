import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "./layout";

import CatalogueForm, {
  type CatalogueFormData } from "../catalogueForm"

import { useAuth } from "../../hooks/context/authContext";

import { fetchCatalogById, updateCatalog} from "../../services/catalogService";

const EditCatalogue = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { accessToken } = useAuth();

  const [catalogue, setCatalogue] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // Load existing catalogue
  useEffect(() => {
    const loadCatalogue = async () => {
      if (!id || !accessToken) {
        setError(
          "Catalogue ID or access token is missing"
        );
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCatalogById(
          id,
          accessToken
        );

        console.log(
          "CATALOGUE FOR EDIT:",
          data
        );

        setCatalogue(data);
      } catch (error: any) {
        setError(
          error.message ||
            "Failed to load catalogue"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCatalogue();
  }, [id, accessToken]);

  const handleSubmit = async (
    data: CatalogueFormData
  ) => {
    if (!id || !accessToken) {
      setError(
        "Catalogue ID or access token is missing"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fd = new FormData();

      fd.append("title", data.title);
      fd.append("category", data.category);
      fd.append("subCategory", data.subCategory);

      if (data.description) {
        fd.append(
          "description",
          data.description
        );
      }

      // Only send new image if user selected one
      if (data.coverImage) {
        fd.append(
          "coverImage",
          data.coverImage
        );
      }

      await updateCatalog(
        id,
        fd,
        accessToken
      );

      navigate("/admin/catalogues");
    } catch (error: any) {
      setError(
        error.message ||
          "Failed to update catalogue"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">
            Loading catalogue...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!catalogue) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-2xl">
          <p className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error ||
              "Catalogue not found"}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <CatalogueForm
        mode="edit"

        initialData={{
          title: catalogue.title,
          description:
            catalogue.description || "",

          category:
            catalogue.category?._id ||
            catalogue.category ||
            "",

          subCategory:
            catalogue.subCategory?._id ||
            catalogue.subCategory ||
            "",

          coverImage:
            catalogue.coverImage || "",
        }}

        loading={saving}
        error={error}

        onSubmit={handleSubmit}

        onCancel={() =>
          navigate("/admin/catalogues")
        }
      />
    </AdminLayout>
  );
};

export default EditCatalogue;

