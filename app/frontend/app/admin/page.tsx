'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api, currentUser } from '../../lib/api';
type Stats = { users: number; products: number; orders: number; revenueCents: number };
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (currentUser()?.role === 'ADMIN')
      api<Stats>('/admin/stats')
        .then(setStats)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
    else setError('Admin access required');
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const d = new FormData(e.currentTarget);
    try {
      await api('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: d.get('sku'),
          name: d.get('name'),
          description: d.get('description'),
          category: d.get('category'),
          priceCents: Number(d.get('priceCents')),
          inventory: Number(d.get('inventory')),
        }),
      });
      setMessage('Product created');
      e.currentTarget.reset();
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Failed');
    }
  }
  return (
    <>
      <h1>Admin dashboard</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {stats && (
        <div className="grid">
          <div className="card">
            <b>Users</b>
            <h2>{stats.users}</h2>
          </div>
          <div className="card">
            <b>Products</b>
            <h2>{stats.products}</h2>
          </div>
          <div className="card">
            <b>Orders</b>
            <h2>{stats.orders}</h2>
          </div>
          <div className="card">
            <b>Revenue</b>
            <h2>${(stats.revenueCents / 100).toFixed(2)}</h2>
          </div>
        </div>
      )}
      <h2>Create product</h2>
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      <form onSubmit={create}>
        <label htmlFor="sku">SKU</label>
        <input id="sku" name="sku" required />
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" required />
        <label htmlFor="category">Category</label>
        <input id="category" name="category" required />
        <label htmlFor="price">Price in cents</label>
        <input id="price" name="priceCents" type="number" min="1" required />
        <label htmlFor="inventory">Inventory</label>
        <input id="inventory" name="inventory" type="number" min="0" required />
        <button>Create product</button>
      </form>
    </>
  );
}
