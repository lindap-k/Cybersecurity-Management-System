import { AppRouter } from './routes';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
