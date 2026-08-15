'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TOPIC_LABELS } from '@xeetcode/shared';
import type { Difficulty } from '@xeetcode/shared';

import { ChatPanel } from '@/components/ChatPanel';
import { CodeEditor } from '@/components/CodeEditor';
import { useGame } from '@/components/GameProvider';
import { MatchTimer } from '@/components/MatchTimer';
import { ResultScreen } from '@/components/ResultScreen';
import { SubmitButton } from '@/components/SubmitButton';
import { VerdictPanel } from '@/components/VerdictPanel';
import { getStoredMatch } from '@/lib/session';
import { usePlayerName } from '@/lib/usePlayerName';

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: 'text-easy',
  medium: 'text-medium',
  hard: 'text-hard',
};

/**
 * Match room, laid out like a coding-interview site: problem on the left,
 * editor and verdict on the right, split by a draggable divider.
 */
export default function MatchRoomPage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const {
    match,
    result,
    submission,
    judging,
    chat,
    opponentOnline,
    connected,
    rejoinMatch,
    submitCode,
    sendChat,
    leaveMatch,
    reset,
  } = useGame();

  const playerName = usePlayerName();
  const [code, setCode] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [splitPercent, setSplitPercent] = useState(42);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed the editor once per match: the player's own draft if they've submitted
  // before, otherwise the starter code. Adjusting state during render (rather
  // than in an effect) is React's sanctioned way to reset on a prop change, and
  // avoids a wasted render pass showing an empty editor.
  if (match && seededFor !== match.matchId) {
    setSeededFor(match.matchId);
    setCode(match.lastCode ?? match.problem.starterCode);
  }

  // Restore state after a refresh.
  useEffect(() => {
    if (match || !connected) return;
    const stored = getStoredMatch();
    if (stored?.matchId === matchId) rejoinMatch(stored.matchId, stored.userId);
  }, [match, connected, matchId, rejoinMatch]);

  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const move = (moveEvent: PointerEvent) => {
      const percent = (moveEvent.clientX / window.innerWidth) * 100;
      setSplitPercent(Math.min(70, Math.max(25, percent)));
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }, []);

  const backToLobby = () => {
    leaveMatch();
    reset();
    router.push('/');
  };

  if (!match) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-ink-muted">Restoring your match…</p>
        <button onClick={backToLobby} className="text-sm text-accent hover:underline">
          Back to lobby
        </button>
      </main>
    );
  }

  const { problem } = match;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge bg-surface px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-semibold text-accent">Xeetcode</span>
          <span className="hidden truncate text-sm text-ink-muted sm:inline">
            {playerName} <span className="font-mono text-win">{match.score}</span>
            <span className="mx-2 text-ink-faint">vs</span>
            {match.opponentName}{' '}
            <span className="font-mono text-ink">{match.opponentScore}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {!opponentOnline && <span className="text-xs text-warn">Opponent disconnected</span>}
          {match.opponentAttemptCount > 0 && (
            <span className="hidden text-xs text-ink-faint sm:inline">
              Opponent tried ×{match.opponentAttemptCount}
            </span>
          )}
          {match.endsAt === null ? (
            <span className="text-xs text-ink-faint">Untimed</span>
          ) : (
            <MatchTimer endsAt={match.endsAt} />
          )}
          <button
            onClick={backToLobby}
            className="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Split panes */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Problem */}
        <section
          className="flex min-h-0 flex-col overflow-hidden border-edge md:border-r"
          style={{ flexBasis: `${splitPercent}%` }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <h1 className="text-lg font-medium text-ink">{problem.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className={DIFFICULTY_TONE[problem.difficulty]}>
                {problem.difficulty[0]?.toUpperCase()}
                {problem.difficulty.slice(1)}
              </span>
              <span className="text-ink-faint">{TOPIC_LABELS[problem.topic]}</span>
            </div>

            <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink-muted">
              {problem.description}
            </div>
          </div>

          <div className="shrink-0">
            <ChatPanel
              messages={chat}
              selfUserId={match.userId}
              onSend={sendChat}
              collapsed={chatCollapsed}
              onToggle={() => setChatCollapsed((current) => !current)}
            />
          </div>
        </section>

        {/* Drag handle — pointer events cover mouse and touch alike. */}
        <div
          onPointerDown={startDrag}
          role="separator"
          aria-orientation="vertical"
          className="hidden w-1 cursor-col-resize bg-edge transition-colors hover:bg-accent md:block"
        />

        {/* Editor + verdict */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-edge bg-surface px-4 py-2">
            <span className="font-mono text-xs text-ink-faint">JavaScript</span>
            <span className="ml-auto mr-3 text-xs text-ink-faint">
              Score <span className="font-mono text-ink">{match.score}</span> · tried{' '}
              {match.attemptCount}
            </span>
            <SubmitButton
              onSubmit={() => submitCode(code)}
              judging={judging}
              solved={match.solved}
              finished={Boolean(result)}
              {...(submission?.cooldownUntil ? { cooldownUntil: submission.cooldownUntil } : {})}
            />
          </div>

          <div className="min-h-0 flex-1">
            <CodeEditor value={code} onChange={setCode} readOnly={Boolean(result)} />
          </div>

          <VerdictPanel submission={submission} judging={judging} />
        </section>
      </div>

      {result && (
        <ResultScreen
          result={result}
          opponentName={match.opponentName}
          onBackToLobby={() => {
            reset();
            router.push('/');
          }}
        />
      )}
    </div>
  );
}
