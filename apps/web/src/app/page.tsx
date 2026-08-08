'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BackendStatus } from '@/components/BackendStatus';
import { Button, Panel } from '@/components/ui';
import { setPlayerName } from '@/lib/session';
import { usePlayerName } from '@/lib/usePlayerName';

export default function HomePage() {
  const storedName = usePlayerName();
  // `draft` is null until the player types, so the field shows the remembered
  // name without an effect copying it into state.
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? storedName;

  const trimmed = name.trim();
  const ready = trimmed.length > 0;

  const remember = () => setPlayerName(trimmed);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-accent-strong">Xeetcode</h1>
        <p className="mt-3 text-ink-muted">Real-time 1v1 competitive coding.</p>
      </header>

      <Panel className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-muted">Your name</span>
          <input
            value={name}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={20}
            placeholder="e.g. nova"
            autoComplete="off"
            className="rounded-lg border border-edge bg-surface-raised px-4 py-3 text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>

        <div className="flex flex-col gap-3">
          <Link href="/play" onClick={remember} aria-disabled={!ready} tabIndex={ready ? 0 : -1}>
            <Button className="w-full" disabled={!ready}>
              Play Online
            </Button>
          </Link>

          <Link href="/friend" onClick={remember} aria-disabled={!ready} tabIndex={ready ? 0 : -1}>
            <Button className="w-full" variant="secondary" disabled={!ready}>
              Play with a Friend
            </Button>
          </Link>
        </div>

        {!ready && <p className="text-center text-sm text-ink-faint">Enter a name to continue.</p>}
      </Panel>

      <div className="flex justify-center">
        <BackendStatus />
      </div>
    </main>
  );
}
