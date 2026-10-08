import { BrowserRouter, Routes, Route } from "react-router-dom";

import Pages from "./pages/pages";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCatalogues from "./pages/admin/catalogues";
import AddCatalogue from "./pages/admin/addCatalogue";
import ManagePages from "./pages/admin/managePages";
import AdminCategories from "./pages/admin/categories";
import AdminSubCategories from "./pages/admin/subcategories";
import ProtectedRoute from "./components/protectedRoute";
import NotFound from "./components/notFound";
import EditCatalogue from "./pages/admin/editCatalogue";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Catalogue */}
        <Route path="/" element={<Pages />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/catalogues" element={<AdminCatalogues />} />
          <Route path="/admin/catalogues/add" element={<AddCatalogue />} />
          <Route path="admin/catalogues/:id/edit" element={<EditCatalogue/>}/>
          <Route path="/admin/catalogues/:catalogId/pages" element={<ManagePages />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/subcategories" element={<AdminSubCategories />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
