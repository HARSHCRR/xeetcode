'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LOBBY_CODE_LENGTH, TOPIC_LABELS } from '@xeetcode/shared';
import type { TopicSelection } from '@xeetcode/shared';

import { useGame } from '@/components/GameProvider';
import { TopicPicker } from '@/components/TopicPicker';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { getPlayerName } from '@/lib/session';

export default function FriendLobbyPage() {
  const router = useRouter();
  const { connected, error, lobbyCode, status, createLobby, joinLobby } = useGame();

  const [topic, setTopic] = useState<TopicSelection>('random');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getPlayerName()) router.replace('/');
  }, [router]);

  const copyCode = async () => {
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
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-16">
        <h1 className="text-center text-3xl font-bold text-accent-strong">Waiting for a friend</h1>

        <Panel className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm text-ink-muted">Share this code — {TOPIC_LABELS[topic]}</p>

          <p className="font-mono text-5xl tracking-[0.4em] text-accent-strong">{lobbyCode}</p>

          <Button variant="secondary" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </Button>

          <Spinner label="Waiting for them to join…" />
          <p className="text-sm text-ink-faint">
            The code stops working once they join, or after 10 minutes.
          </p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-3xl font-bold text-accent-strong">Play with a Friend</h1>

      {error && <ErrorNote message={error} />}

      <Panel className="flex flex-col gap-5">
        <h2 className="font-medium text-ink">Create a lobby</h2>
        <TopicPicker value={topic} onChange={setTopic} />
        <Button onClick={() => createLobby(topic)} disabled={!connected}>
          {connected ? 'Create lobby' : 'Connecting…'}
        </Button>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <h2 className="font-medium text-ink">Join with a code</h2>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={LOBBY_CODE_LENGTH}
          placeholder="ABC123"
          autoComplete="off"
          aria-label="Lobby code"
          className="rounded-lg border border-edge bg-surface-raised px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-ink outline-none placeholder:text-ink-faint focus:border-accent"
        />
        <Button
          variant="secondary"
          onClick={() => joinLobby(code)}
          disabled={!connected || code.trim().length !== LOBBY_CODE_LENGTH}
        >
          Join lobby
        </Button>
      </Panel>

      <Button variant="ghost" onClick={() => router.push('/')}>
        Back
      </Button>
    </main>
  );
}
