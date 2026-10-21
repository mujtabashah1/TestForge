import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AuthActions } from './auth-actions';

export const metadata: Metadata = {
  title: 'TestForge Store',
  description: 'A testable commerce platform',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav aria-label="Main navigation">
          <Link className="brand" href="/">
            Test<span>Forge</span>
          </Link>
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/admin">Admin</Link>
          <AuthActions />
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
