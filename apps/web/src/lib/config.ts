/**
 * The realtime backend lives outside Vercel (see the Phase 0 design), so the
 * browser needs its absolute URL at build time.
 *
 * `NEXT_PUBLIC_BACKEND_URL` overrides this when set — useful for pointing a
 * preview deployment at a different backend. The defaults below just mean the
 * common cases work with no configuration: localhost in dev, the deployed
 * Render service in production. Neither is a secret; both are public URLs the
 * browser reveals anyway.
 */
const PRODUCTION_BACKEND_URL = 'https://xeetcode-server.onrender.com';
const LOCAL_BACKEND_URL = 'http://localhost:4000';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (process.env.NODE_ENV === 'production' ? PRODUCTION_BACKEND_URL : LOCAL_BACKEND_URL);
