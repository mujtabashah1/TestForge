'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, money, type Order } from '../../lib/api';
function OrdersContent() {
  const created = useSearchParams().get('created');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ items: Order[] }>('/orders')
      .then((d) => setOrders(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, []);
  return (
    <>
      <h1>Order history</h1>
      {created && (
        <p className="success" role="status">
          Order confirmed: {created}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((o) => (
          <article className="card" key={o.id}>
            <div className="row">
              <h2>Order {o.id.slice(-8)}</h2>
              <strong>{o.status}</strong>
            </div>
            <p>
              {new Date(o.createdAt).toLocaleString()} · {money(o.totalCents)} · Payment{' '}
              {o.payment?.status}
            </p>
            <ul>
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {i.productName}
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p aria-live="polite">Loading orders…</p>}>
      <OrdersContent />
    </Suspense>
  );
}
