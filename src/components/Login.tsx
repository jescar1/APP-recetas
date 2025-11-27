import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Lock, Mail, User, ArrowLeft } from 'lucide-react';
import logo from '../logo.png';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface LoginProps {
  onLogin: (user: any, isAdmin: boolean) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dd414dcc/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ email, password, name }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al registrarse');
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        onLogin(signInData.user, false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const isAdmin = data.user.user_metadata?.role === 'admin';
        onLogin(data.user, isAdmin);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app-receta.netlify.app/reset-password#/',
      });

      if (error) throw error;

      setMessage('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
              <img src={logo} alt="Saborify" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-gray-900 mb-2 text-2xl font-bold">Recuperar Contraseña</h1>
            <p className="text-gray-600">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setMessage('');
                  setEmail('');
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <img src={logo} alt="Saborify" className="w-full h-full object-contain" />
          </div>
         
          <p className="text-gray-600">
            {isSignUp ? 'Crea tu cuenta para comenzar' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-gray-700 font-medium">
                  Contraseña
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Procesando...' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-2 text-center text-sm font-medium">
              Credenciales de prueba:
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <p className="text-gray-700">
                <strong>Admin:</strong> admin@recetas.com / admin123
              </p>
              <p className="text-gray-700">
                <strong>Usuario:</strong> usuario@recetas.com / usuario123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}