import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserCircle, UserCog, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const roles = [
  { value: 'employee', label: 'Employee', description: 'Report incidents', icon: UserCircle, color: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { value: 'analyst', label: 'Security Analyst', description: 'Review and manage incidents', icon: UserCog, color: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { value: 'administrator', label: 'Administrator', description: 'Full system access', icon: Users, color: 'bg-green-50 hover:bg-green-100 border-green-200' },
];

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (selectedRole && user.role?.toLowerCase() !== selectedRole) {
        setError(`This account belongs to the ${user.role} role.`);
        return;
      }
      toast.success('Login successful', { description: `Welcome back, ${user.name}.` });
      navigate(user.role?.toLowerCase() === 'employee' ? '/report' : '/dashboard');
    } catch (apiError) {
      setError((apiError as Error).message);
      toast.error('Login failed', { description: (apiError as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">CyberGuard</h1>
          </div>
          <p className="text-slate-600">Figma-designed UI connected to a real Flask API</p>
        </div>

        {!selectedRole ? (
          <div>
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Choose your role</CardTitle>
                <CardDescription>Role selection stays in the UI, but the backend remains the source of truth after login.</CardDescription>
              </CardHeader>
            </Card>
            <div className="grid gap-6 md:grid-cols-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Card key={role.value} className={`cursor-pointer border-2 transition-all ${role.color}`} onClick={() => setSelectedRole(role.value)}>
                    <CardHeader className="text-center">
                      <div className="mb-4 flex justify-center"><div className="rounded-full bg-white p-4 shadow"><Icon className="h-8 w-8 text-slate-700" /></div></div>
                      <CardTitle>{role.label}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent><Button className="w-full" variant="outline">Select</Button></CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>This Figma screen now calls <code>/api/auth/login</code> instead of mock data.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@cyberguard.local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
                  </div>
                  {error ? (
                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedRole(null)}>Back</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card className="mt-4 border-blue-200 bg-blue-50">
              <CardContent className="pt-4 text-xs text-slate-700">
                <p className="font-semibold">Seeded users after POST /api/setup</p>
                <p>Admin: admin@cyberguard.local / Admin123!</p>
                <p>Analyst: analyst@cyberguard.local / Analyst123!</p>
                <p>Employee: employee@cyberguard.local / Employee123!</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
