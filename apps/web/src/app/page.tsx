'use client';

import { useState } from 'react';

import { LOBBY_CODE_LENGTH, TIMED_DURATION_MINUTES } from '@xeetcode/shared';

import { useGame } from '@/components/GameProvider';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { setPlayerName } from '@/lib/session';
import { usePlayerName } from '@/lib/usePlayerName';

/**
 * The whole pre-match flow on one page: pick a name, create a code or enter a
 * friend's. There is no matchmaking queue and no topic picker — every match
 * draws a random problem from the Blind 75 bank.
 */
export default function HomePage() {
  const { connected, error, lobbyCode, status, createLobby, joinLobby } = useGame();

  const storedName = usePlayerName();
  const [draft, setDraft] = useState<string | null>(null);
  const name = (draft ?? storedName).slice(0, 20);

  const [timed, setTimed] = useState(true);
  const [minutes, setMinutes] = useState<number>(15);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const ready = name.trim().length > 0 && connected;

  const remember = () => setPlayerName(name.trim());

  const create = () => {
    remember();
    createLobby({ timed, ...(timed ? { minutes } : {}) });
  };

  const join = () => {
    remember();
    joinLobby(code);
  };

  const copy = async () => {
    if (!lobbyCode) return;
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is on screen to read out anyway.
    }
  };

  if (status === 'hosting' && lobbyCode) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
        <Header />
        <Panel className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm text-ink-muted">Share this code with your friend</p>
          <p className="font-mono text-5xl tracking-[0.35em] text-accent">{lobbyCode}</p>
          <Button variant="secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy code'}
          </Button>
          <Spinner label="Waiting for them to join…" />
          <p className="text-xs text-ink-faint">
            {timed ? `${minutes}-minute match` : 'Untimed match'} · the code works once, and expires
            after 10 minutes.
          </p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-16">
      <Header />

      {error && <ErrorNote message={error} />}

      <Panel className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-muted">Your name</span>
          <input
            value={name}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={20}
            placeholder="e.g. nova"
            autoComplete="off"
            className="rounded-md border border-edge bg-surface-raised px-4 py-2.5 text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-muted">Match length</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimed(false)}
              aria-pressed={!timed}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                !timed ? 'border-accent bg-accent-soft text-ink' : 'border-edge text-ink-muted'
              }`}
            >
              Untimed
            </button>
            {TIMED_DURATION_MINUTES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTimed(true);
                  setMinutes(option);
                }}
                aria-pressed={timed && minutes === option}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  timed && minutes === option
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-edge text-ink-muted'
                }`}
              >
                {option}m
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            {timed
              ? 'Highest score when the clock runs out wins.'
              : 'First to pass every test wins.'}
          </p>
        </div>

        <Button onClick={create} disabled={!ready}>
          {connected ? 'Play with a friend' : 'Connecting…'}
        </Button>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <span className="text-sm font-medium text-ink-muted">Got a code?</span>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase().trim())}
            maxLength={LOBBY_CODE_LENGTH}
            placeholder="ABC123"
            autoComplete="off"
            aria-label="Match code"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && code.length === LOBBY_CODE_LENGTH && ready) join();
            }}
            className="min-w-0 flex-1 rounded-md border border-edge bg-surface-raised px-4 py-2.5 text-center font-mono text-xl tracking-[0.3em] text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
          <Button
            variant="secondary"
            onClick={join}
            disabled={!ready || code.length !== LOBBY_CODE_LENGTH}
          >
            Join
          </Button>
        </div>
      </Panel>

      <p className="text-center text-xs text-ink-faint">
        Score = tests passed × 10 − attempts × 2, +50 for a full pass.
      </p>
    </main>
  );
}

function Header() {
  return (
    <header className="text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">
        <span className="text-accent">Xeet</span>code
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        1v1 on a random Blind 75 problem.
      </p>
    </header>
  );
}
