import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { LoginPage } from './pages/LoginPage';

import { DashboardPage } from './pages/DashboardPage';

import { StudyPage } from './pages/StudyPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
}

import { ErrorBoundary } from './components/ErrorBoundary';

import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
        <p className="text-slate-400 font-medium">Loading Study Buddy...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/study/:documentId"
              element={
                <PrivateRoute>
                  <StudyPage />
                </PrivateRoute>
              }
            />
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
