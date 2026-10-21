'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money, type Product } from '../../lib/api';

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load(search = '') {
    setLoading(true);
    setError('');
    try {
      const d = await api<{ items: Product[] }>(`/products?search=${encodeURIComponent(search)}`);
      setItems(d.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void load(String(new FormData(e.currentTarget).get('search') ?? ''));
  }
  async function add(id: string) {
    try {
      await api('/cart/items', {
        method: 'PUT',
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      alert('Added to cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }
  return (
    <>
      <div className="row">
        <h1>Products</h1>
        <form onSubmit={search} style={{ marginLeft: 'auto' }}>
          <label className="muted" htmlFor="search">
            Search catalog
          </label>
          <input id="search" name="search" placeholder="Name or SKU" />
        </form>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <p aria-live="polite">Loading products…</p>
      ) : items.length === 0 ? (
        <p>No products match your search.</p>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <article className="card" key={p.id}>
              <p>
                {p.category} · {p.sku}
              </p>
              <h2>
                <Link href={`/products/${p.id}`}>{p.name}</Link>
              </h2>
              <p>{p.description}</p>
              <p className="price">{money(p.priceCents)}</p>
              <p>{p.inventory} in stock</p>
              <button disabled={!p.inventory} onClick={() => void add(p.id)}>
                Add to cart
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
