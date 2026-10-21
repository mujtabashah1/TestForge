'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, saveSession, type User } from '../../lib/api';
export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const d = new FormData(e.currentTarget);
    try {
      const session = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: d.get('name'),
          email: d.get('email'),
          password: d.get('password'),
        }),
      });
      saveSession(session);
      router.push('/products');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Registration failed');
    }
  }
  return (
    <>
      <h1>Create account</h1>
      <form onSubmit={submit}>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required minLength={2} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} required />
        <button>Create account</button>
      </form>
    </>
  );
}
