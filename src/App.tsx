import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { InitialSetup } from './components/InitialSetup';
import { ResetPassword } from './components/ResetPassword';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkSetupAndSession();
  }, []);

  const checkSetupAndSession = async () => {
    try {
      // Check if recipes exist
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dd414dcc/recipes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const recipes = await response.json();
        if (recipes.length === 0) {
          setNeedsSetup(true);
          setLoading(false);
          return;
        }
      }

      // Check session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Check if user is admin
        const adminStatus = session.user.user_metadata?.role === 'admin';
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // If there's an error, we might need setup
      setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    checkSetupAndSession();
  };

  const handleLogin = async (user: any, isAdminUser: boolean) => {
    setUser(user);
    setIsAdmin(isAdminUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de Reset Password - Pública */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        {needsSetup ? (
          <Route path="*" element={<InitialSetup onComplete={handleSetupComplete} />} />
        ) : !user ? (
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        ) : (
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
                {isAdmin ? (
                  <AdminPanel onLogout={handleLogout} user={user} />
                ) : (
                  <UserDashboard onLogout={handleLogout} user={user} />
                )}
              </div>
            }
          />
        )}
      </Routes>
    </Router>
  );
}