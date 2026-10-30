/**
 * Auth helper — extracts and validates user session from NextAuth.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Returns user ID from session or null.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getAuthSession();
  const user = session?.user;

  if (!user || typeof user !== 'object') {
    return null;
  }

  const id = 'id' in user ? user.id : null;
  return typeof id === 'string' ? id : null;
}
