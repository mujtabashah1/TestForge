import Link from 'next/link';
export default function Home() {
  return (
    <section className="hero">
      <p className="muted">ENTERPRISE COMMERCE SANDBOX</p>
      <h1>
        Built to shop.
        <br />
        Forged to test.
      </h1>
      <p>
        A persistent e-commerce application designed to demonstrate resilient automation across UI,
        API, and PostgreSQL.
      </p>
      <Link className="button" href="/products">
        Browse products
      </Link>
    </section>
  );
}
