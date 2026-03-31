import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Shield, LayoutDashboard, FileText, User } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Toaster } from "./ui/sonner";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged Out", {
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const canAccessDashboard = user?.role === "analyst" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">CyberGuard Dashboard</h1>
                <p className="text-blue-100 text-xs">Incident Management System</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                {canAccessDashboard && (
                  <Link to="/dashboard">
                    <Button
                      variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
                      className={
                        location.pathname === "/dashboard"
                          ? "text-blue-900"
                          : "text-white hover:bg-blue-700"
                      }
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Link to="/report">
                  <Button
                    variant={location.pathname === "/report" ? "secondary" : "ghost"}
                    className={
                      location.pathname === "/report"
                        ? "text-blue-900"
                        : "text-white hover:bg-blue-700"
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Report Incident
                  </Button>
                </Link>
              </nav>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-blue-700">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-blue-600 mt-1 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem>Team Management</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex gap-2 mt-4">
            {canAccessDashboard && (
              <Link to="/dashboard" className="flex-1">
                <Button
                  variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
                  className={`w-full ${
                    location.pathname === "/dashboard"
                      ? "text-blue-900"
                      : "text-white hover:bg-blue-700"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            <Link to="/report" className="flex-1">
              <Button
                variant={location.pathname === "/report" ? "secondary" : "ghost"}
                className={`w-full ${
                  location.pathname === "/report"
                    ? "text-blue-900"
                    : "text-white hover:bg-blue-700"
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Report
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>&copy; 2026 CyberGuard. All incidents are logged and monitored.</p>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}