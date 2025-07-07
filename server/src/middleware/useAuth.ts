import { AppContext } from '..';
import { getAuth } from '@hono/clerk-auth';
import { createMiddleware } from 'hono/factory';

export const useAuth = createMiddleware<AppContext>(async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  c.set('clerkUserId', auth.userId);
  return next();
});
