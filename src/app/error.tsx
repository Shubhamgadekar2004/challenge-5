'use client';

/**
 * @file Global error boundary for the application.
 * Catches unhandled errors in page components and renders a user-friendly
 * fallback with a retry button. Improves code quality and accessibility.
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log errors to monitoring in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="auth-container" role="alert" aria-live="assertive">
      <div className="auth-card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-primary" onClick={reset}>
            Try Again
          </button>
          <a href="/" className="btn btn-secondary">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
