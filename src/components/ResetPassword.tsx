import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setTokenValid(true);
    } else {
      setError('El enlace de recuperación es inválido o ha expirado.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }

    setLoading(false);
  };

  if (!tokenValid) {
    return (
      <div className="text-center p-12">
        <h1>{error}</h1>
      </div>
    );
  }

  return success ? (
    <div className="text-center p-12">
      <h1>¡Contraseña actualizada!</h1>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-w-md mx-auto">
      <h2>Nueva contraseña</h2>

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <button disabled={loading}>
        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
      </button>
    </form>
  );
}
