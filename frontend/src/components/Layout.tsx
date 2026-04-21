import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileWarning, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'analyst'] },
    { to: '/report', label: 'Report Incident', icon: FileWarning, roles: ['administrator', 'analyst', 'employee'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">CyberGuard CIMS</h1>
              <p className="text-sm text-slate-500">Figma UI + Flask API bridge</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-slate-900">{user?.name}</p>
              <p className="text-slate-500">{user?.role}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-2xl bg-white p-4 shadow-sm lg:col-span-3">
          <nav className="space-y-2">
            {navItems
              .filter((item) => !user?.role || item.roles.includes(user.role.toLowerCase()))
              .map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </aside>
        <main className="col-span-12 lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
