import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "./layout";
import CatalogueForm, {
  type CatalogueFormData } from "../catalogueForm"

import { useAuth } from "../../hooks/context/authContext";
import { createCatalog } from "../../services/catalogService";

const AddCatalogue = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    data: CatalogueFormData
  ) => {
    if (!accessToken) {
      setError("Access token is missing");
      return;
    }

    setLoading(true);
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

      if (data.coverImage) {
        fd.append(
          "coverImage",
          data.coverImage
        );
      }

      const catalog = await createCatalog(
        fd,
        accessToken
      );

      navigate(
        `/admin/catalogues/${catalog._id}/pages`
      );
    } catch (error: any) {
      setError(
        error.message ||
          "Failed to create catalogue"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <CatalogueForm
        mode="add"
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate("/admin/catalogues")
        }
      />
    </AdminLayout>
  );
};

export default AddCatalogue;

