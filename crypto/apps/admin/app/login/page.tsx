'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, ApiError } from '../lib/api';
import { setToken } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Field, Input } from '../components/ui/field';

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
      <form onSubmit={onSubmit} className="panel w-full max-w-sm rounded-xl p-8">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            Адмінка
          </span>
        </div>

        <h1 className="mt-5 text-xl font-medium">Вхід</h1>

        <Field label="Email" className="mt-6">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Пароль" className="mt-4">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <Button type="submit" variant="primary" loading={loading} className="mt-6 w-full">
          Увійти
        </Button>
      </form>
    </main>
  );
}
