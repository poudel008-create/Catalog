import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, FolderTree, Layers3, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../hooks/context/authContext";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Catalogues", icon: BookOpen, href: "/admin/catalogues" },
  { label: "Categories", icon: FolderTree, href: "/admin/categories" },
  { label: "Sub-Categories", icon: Layers3, href: "/admin/subcategories" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Catalogue</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = location.pathname === href || location.pathname.startsWith(href + "/");
            return (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.fullName?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm">Catalogue Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {NAV.map(({ icon: Icon, href }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={`rounded-lg p-1.5 transition-colors ${
                  location.pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
