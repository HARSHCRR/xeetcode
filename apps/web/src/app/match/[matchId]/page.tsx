'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TOPIC_LABELS } from '@xeetcode/shared';

import { useGame } from '@/components/GameProvider';
import { Button, Panel, Spinner } from '@/components/ui';
import { getStoredMatch } from '@/lib/session';
import { usePlayerName } from '@/lib/usePlayerName';

/**
 * Phase 2 match room: proves both players routed into the same match with the
 * same problem. The Monaco editor, countdown, and judging arrive in Phase 3;
 * chat in Phase 4.
 */
export default function MatchRoomPage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const { match, rejoinMatch, reset, connected } = useGame();
  const playerName = usePlayerName();

  // A refresh drops in-memory state; ask the server to resend it.
  useEffect(() => {
    if (match || !connected) return;
    const stored = getStoredMatch();
    if (stored?.matchId === matchId) rejoinMatch(stored.matchId, stored.userId);
  }, [match, connected, matchId, rejoinMatch]);

  const leave = () => {
    reset();
    router.push('/');
  };

  if (!match) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6">
        <Spinner label="Restoring your match…" />
        <p className="max-w-sm text-center text-sm text-ink-faint">
          If this doesn&apos;t resolve, the match may have ended.
        </p>
        <Button variant="ghost" onClick={leave}>
          Back to lobby
        </Button>
      </main>
    );
  }

  const { problem } = match;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-faint">
            {match.mode === 'friend' ? 'Friend match' : 'Ranked match'}
          </p>
          <h1 className="text-2xl font-bold text-accent-strong">
            {playerName} <span className="text-ink-faint">vs</span> {match.opponentName}
          </h1>
        </div>
        <Button variant="ghost" onClick={leave}>
          Back to lobby
        </Button>
      </header>

      <Panel className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-ink">{problem.title}</h2>
          <span className="rounded-full border border-edge px-3 py-1 text-xs text-ink-muted">
            {TOPIC_LABELS[problem.topic]}
          </span>
          <span className="rounded-full border border-edge px-3 py-1 text-xs text-ink-muted">
            {problem.difficulty}
          </span>
        </div>

        {/* Plain text for now — markdown rendering lands with the editor in Phase 3. */}
        <pre className="overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-muted">
          {problem.description}
        </pre>

        <code className="overflow-x-auto rounded-lg border border-edge bg-surface-raised p-4 text-sm text-cyan">
          {problem.functionSignature}
        </code>
      </Panel>

      <Panel className="text-center text-sm text-ink-faint">
        Editor, timer, and submissions arrive in Phase 3.
        <span className="mt-2 block font-mono text-xs">match {matchId.slice(0, 8)}</span>
      </Panel>
    </main>
  );
}
