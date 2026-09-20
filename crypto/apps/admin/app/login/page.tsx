'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, ApiError } from '../lib/api';
import { setToken } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await login(email, password);
      setToken(accessToken);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося увійти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="panel rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold">Вхід в адмінку</h1>
        <p className="mt-1 text-sm text-ink-muted">Крипто курси</p>

        <label className="block mt-6 text-sm text-ink-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent"
        />

        <label className="block mt-4 text-sm text-ink-muted">Пароль</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent"
        />

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-accent text-bg font-medium py-2.5 disabled:opacity-50"
        >
          {loading ? 'Вхід...' : 'Увійти'}
        </button>
      </form>
    </main>
  );
}
