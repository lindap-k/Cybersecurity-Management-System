// Mock user data for authentication
export interface User {
  id: string;
  username: string;
  password: string;
  role: "employee" | "analyst" | "admin";
  fullName: string;
  email: string;
}

export const mockUsers: User[] = [
  // Employees
  {
    id: "emp-001",
    username: "john.smith",
    password: "employee123",
    role: "employee",
    fullName: "John Smith",
    email: "john.smith@cyberguard.com",
  },
  {
    id: "emp-002",
    username: "mike.davis",
    password: "employee123",
    role: "employee",
    fullName: "Mike Davis",
    email: "mike.davis@cyberguard.com",
  },
  {
    id: "emp-003",
    username: "emily.wilson",
    password: "employee123",
    role: "employee",
    fullName: "Emily Wilson",
    email: "emily.wilson@cyberguard.com",
  },
  
  // Analysts
  {
    id: "ana-001",
    username: "sarah.johnson",
    password: "analyst123",
    role: "analyst",
    fullName: "Sarah Johnson",
    email: "sarah.johnson@cyberguard.com",
  },
  {
    id: "ana-002",
    username: "alex.chen",
    password: "analyst123",
    role: "analyst",
    fullName: "Alex Chen",
    email: "alex.chen@cyberguard.com",
  },
  {
    id: "ana-003",
    username: "mike.rodriguez",
    password: "analyst123",
    role: "analyst",
    fullName: "Mike Rodriguez",
    email: "mike.rodriguez@cyberguard.com",
  },
  
  // Admins
  {
    id: "adm-001",
    username: "admin",
    password: "admin123",
    role: "admin",
    fullName: "System Administrator",
    email: "admin@cyberguard.com",
  },
  {
    id: "adm-002",
    username: "security.admin",
    password: "admin123",
    role: "admin",
    fullName: "Security Admin",
    email: "security.admin@cyberguard.com",
  },
];

export const authenticateUser = (username: string, password: string, role: string): User | null => {
  const user = mockUsers.find(
    (u) => u.username === username && u.password === password && u.role === role
  );
  return user || null;
};
