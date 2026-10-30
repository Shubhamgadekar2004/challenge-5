/**
 * @file Custom 404 page.
 * Provides a user-friendly "not found" experience with navigation back to the dashboard.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth-container">
      <div className="auth-card text-center">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ marginBottom: '0.5rem' }}>Page Not Found</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
