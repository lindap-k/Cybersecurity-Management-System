import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Shield, UserCircle, UserCog, Users, AlertCircle } from "lucide-react";
import { authenticateUser } from "../data/users";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"employee" | "analyst" | "admin" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = [
    {
      value: "employee" as const,
      label: "Employee",
      description: "Report security incidents",
      icon: UserCircle,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      activeColor: "bg-blue-100 border-blue-500",
    },
    {
      value: "analyst" as const,
      label: "Security Analyst",
      description: "Investigate and manage incidents",
      icon: UserCog,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      activeColor: "bg-purple-100 border-purple-500",
    },
    {
      value: "admin" as const,
      label: "Administrator",
      description: "Full system access",
      icon: Users,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      activeColor: "bg-green-100 border-green-500",
    },
  ];

  const handleRoleSelect = (role: "employee" | "analyst" | "admin") => {
    setSelectedRole(role);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user = authenticateUser(username, password, selectedRole);

    setIsLoading(false);

    if (user) {
      login(user);
      toast.success("Login Successful", {
        description: `Welcome back, ${user.fullName}!`,
      });
      
      // Navigate based on role
      if (user.role === "employee") {
        navigate("/report");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError("Invalid username or password for the selected role");
      toast.error("Login Failed", {
        description: "Please check your credentials and try again.",
      });
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">CyberGuard</h1>
          </div>
          <p className="text-gray-600">Incident Management System</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div>
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription className="text-base">
                  Please select your role to continue
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Card
                    key={role.value}
                    className={`cursor-pointer transition-all border-2 ${role.color}`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-white shadow-md">
                          <Icon className="h-8 w-8 text-gray-700" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{role.label}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button variant="outline" className="w-full">
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Demo Credentials Info */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Demo Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold">Employee:</p>
                    <p>Username: john.smith</p>
                    <p>Password: employee123</p>
                  </div>
                  <div>
                    <p className="font-semibold">Analyst:</p>
                    <p>Username: sarah.johnson</p>
                    <p>Password: analyst123</p>
                  </div>
                  <div>
                    <p className="font-semibold">Admin:</p>
                    <p>Username: admin</p>
                    <p>Password: admin123</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Login Form */
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-blue-100">
                    {selectedRole === "employee" && <UserCircle className="h-8 w-8 text-blue-600" />}
                    {selectedRole === "analyst" && <UserCog className="h-8 w-8 text-purple-600" />}
                    {selectedRole === "admin" && <Users className="h-8 w-8 text-green-600" />}
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  {selectedRole === "employee" && "Employee Login"}
                  {selectedRole === "analyst" && "Security Analyst Login"}
                  {selectedRole === "admin" && "Administrator Login"}
                </CardTitle>
                <CardDescription>
                  Enter your credentials to access the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Logging in...
                        </span>
                      ) : (
                        "Login"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back to Role Selection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Demo Credentials for Selected Role */}
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardContent className="pt-4 text-xs">
                <p className="font-semibold mb-2">Demo Credentials:</p>
                {selectedRole === "employee" && (
                  <div>
                    <p>Username: john.smith or mike.davis</p>
                    <p>Password: employee123</p>
                  </div>
                )}
                {selectedRole === "analyst" && (
                  <div>
                    <p>Username: sarah.johnson or alex.chen</p>
                    <p>Password: analyst123</p>
                  </div>
                )}
                {selectedRole === "admin" && (
                  <div>
                    <p>Username: admin</p>
                    <p>Password: admin123</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
