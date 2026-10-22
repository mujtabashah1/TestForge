'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearSession, currentUser } from '../lib/api';
export function AuthActions() {
  const router = useRouter();
  const user = currentUser();
  if (!user)
    return (
      <>
        <Link href="/register">Register</Link>
        <Link href="/login">Sign in</Link>
      </>
    );
  return (
    <button
      className="secondary"
      onClick={async () => {
        try {
          await api<void>('/auth/logout', { method: 'POST' });
        } finally {
          clearSession();
          router.push('/');
          router.refresh();
        }
      }}
    >
      Sign out {user.name}
    </button>
  );
}
