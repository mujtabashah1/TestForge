'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, money, type Product } from '../../lib/api';
type CartItem = { id: string; quantity: number; product: Product };
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const d = await api<{ items: CartItem[]; totalCents: number }>('/cart');
      setItems(d.items);
      setTotal(d.totalCents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function quantity(item: CartItem, value: number) {
    await api('/cart/items', {
      method: 'PUT',
      body: JSON.stringify({ productId: item.product.id, quantity: value }),
    });
    await load();
  }
  async function remove(id: string) {
    await api(`/cart/items/${id}`, { method: 'DELETE' });
    await load();
  }
  async function checkout(token: 'tok_success' | 'tok_fail') {
    setBusy(true);
    setError('');
    try {
      const d = await api<{ order: { id: string } }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), paymentToken: token }),
      });
      router.push(`/orders?created=${d.order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Your cart</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="grid">
            {items.map((i) => (
              <article className="card" key={i.id}>
                <h2>{i.product.name}</h2>
                <p>{money(i.product.priceCents)} each</p>
                <label htmlFor={`qty-${i.id}`}>Quantity</label>
                <input
                  id={`qty-${i.id}`}
                  type="number"
                  min="1"
                  max={i.product.inventory}
                  value={i.quantity}
                  onChange={(e) => void quantity(i, Number(e.target.value))}
                />
                <button className="secondary" onClick={() => void remove(i.product.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
          <h2>Total: {money(total)}</h2>
          <div className="row">
            <button disabled={busy} onClick={() => void checkout('tok_success')}>
              Pay and place order
            </button>
            <button className="secondary" disabled={busy} onClick={() => void checkout('tok_fail')}>
              Simulate declined payment
            </button>
          </div>
        </>
      )}
    </>
  );
}
