import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FolderTree, Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./layout";
import { useAuth } from "../../hooks/context/authContext";
import { fetchCatalogs, type Catalog } from "../../services/catalogService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!accessToken) {
    setLoading(false);
    return;
  }

  fetchCatalogs(accessToken)
    .then(setCatalogs)
    .finally(() => setLoading(false));
}, [accessToken]);

  const stats = [
    { label: "Total Catalogues", value: catalogs.length, icon: BookOpen },
    { label: "Categories", value: 3, icon: FolderTree },
    { label: "Sub-Categories", value: 3, icon: Layers3 },
  ];

  const recent = catalogs.slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-muted-foreground">
            Overview of your catalogue management system.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <h3 className="mt-1 text-3xl font-bold">
                    {loading ? "—" : value}
                  </h3>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Add Catalogue",
                desc: "Create a new catalogue",
                icon: Plus,
                href: "/admin/catalogues/add",
              },
              {
                title: "Manage Categories",
                desc: "Add or edit categories",
                icon: FolderTree,
                href: "/admin/categories",
              },
              {
                title: "Sub-Categories",
                desc: "Manage sub-categories",
                icon: Layers3,
                href: "/admin/subcategories",
              },
            ].map(({ title, desc, icon: Icon, href }) => (
              <Card
                key={href}
                className="cursor-pointer transition hover:shadow-md"
                onClick={() => navigate(href)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Catalogues */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Catalogues</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/catalogues")}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No catalogues yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate("/admin/catalogues/add")}
                  >
                    <Plus className="h-4 w-4" /> Add Catalogue
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {cat.coverImage ? (
                          <img
                            src={cat.coverImage}
                            alt={cat.title}
                            className="h-9 w-9 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <p className="font-medium">{cat.title}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          cat.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {cat.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Published Catalogues */}
          <Card>
            <CardHeader>
              <CardTitle>Published Catalogues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-semibold">
                    {catalogs.filter((c) => c.published).length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: catalogs.length
                        ? `${(catalogs.filter((c) => c.published).length / catalogs.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-semibold">
                    {catalogs.filter((c) => !c.published).length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{
                      width: catalogs.length
                        ? `${(catalogs.filter((c) => !c.published).length / catalogs.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
