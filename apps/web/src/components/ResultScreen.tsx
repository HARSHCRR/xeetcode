'use client';

import type { MatchEndPayload } from '@xeetcode/shared';

const HEADLINE: Record<MatchEndPayload['result'], string> = {
  win: 'Accepted — you win',
  loss: 'Opponent solved it first',
  draw: 'Time — draw',
  forfeit: 'Match forfeited',
};

const TONE: Record<MatchEndPayload['result'], string> = {
  win: 'text-win',
  loss: 'text-lose',
  draw: 'text-warn',
  forfeit: 'text-warn',
};

export function ResultScreen({
  result,
  opponentName,
  onBackToLobby,
}: {
  result: MatchEndPayload;
  opponentName: string;
  onBackToLobby: () => void;
}) {
  const { ratingChange, ratingAfter, ratingBefore, status } = result;
  const drawn = status === 'draw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div
        role="dialog"
        aria-modal
        aria-label="Match result"
        className="w-full max-w-md rounded-lg border border-edge bg-surface p-8 text-center"
      >
        <h2 className={`text-2xl font-semibold ${TONE[result.result]}`}>
          {HEADLINE[result.result]}
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          {drawn
            ? 'Scores were level.'
            : result.winnerName
              ? `${result.winnerName} took it.`
              : 'The match ended.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-edge bg-surface-raised p-3">
            <p className="text-xs uppercase tracking-wider text-ink-faint">You</p>
            <p className="mt-1 font-mono text-2xl text-ink">{result.score}</p>
          </div>
          <div className="rounded-md border border-edge bg-surface-raised p-3">
            <p className="truncate text-xs uppercase tracking-wider text-ink-faint">
              {opponentName}
            </p>
            <p className="mt-1 font-mono text-2xl text-ink-muted">{result.opponentScore}</p>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-edge bg-surface-raised p-4">
          <p className="text-xs uppercase tracking-wider text-ink-faint">Rating</p>
          <p className="mt-1 flex items-baseline justify-center gap-2">
            <span className="font-mono text-2xl text-ink">{ratingAfter}</span>
            {ratingChange !== 0 && (
              <span
                className={`font-mono text-sm ${ratingChange > 0 ? 'text-win' : 'text-lose'}`}
              >
                {ratingChange > 0 ? '+' : ''}
                {ratingChange}
              </span>
            )}
          </p>
          {ratingChange === 0 && (
            <p className="mt-1 text-xs text-ink-faint">
              {drawn ? 'Draws leave ratings unchanged.' : `Unchanged from ${ratingBefore}.`}
            </p>
          )}
        </div>

        <button
          onClick={onBackToLobby}
          className="mt-6 w-full rounded-md bg-accent px-4 py-2.5 font-medium text-[#1a1a1a] transition-colors hover:bg-accent-strong"
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
}
