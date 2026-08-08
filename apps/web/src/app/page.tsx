import { BackendStatus } from '@/components/BackendStatus';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-ink-faint">Phase 1 · Foundation</p>

      <h1 className="text-5xl font-bold tracking-tight text-accent-strong">Xeetcode</h1>

      <p className="text-balance text-ink-muted">
        Real-time 1v1 competitive coding. The pipeline is live — matchmaking and lobbies arrive in
        Phase 2.
      </p>

      <BackendStatus />
    </main>
  );
}
