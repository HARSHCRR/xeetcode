/**
 * The realtime backend lives outside Vercel (see the Phase 0 design), so the
 * browser needs its absolute URL at build time.
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';
