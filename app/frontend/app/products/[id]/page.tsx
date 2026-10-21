'use client';
import { use, useEffect, useState } from 'react';
import { api, money, type Product } from '../../../lib/api';
export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ product: Product }>(`/products/${id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [id]);
  if (error)
    return (
      <p role="alert" className="error">
        {error}
      </p>
    );
  if (!product) return <p>Loading product…</p>;
  return (
    <article className="card">
      <p>{product.category}</p>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">{money(product.priceCents)}</p>
      <p>{product.inventory} in stock</p>
      <button
        onClick={() =>
          void api('/cart/items', {
            method: 'PUT',
            body: JSON.stringify({ productId: id, quantity: 1 }),
          })
        }
      >
        Add to cart
      </button>
    </article>
  );
}
