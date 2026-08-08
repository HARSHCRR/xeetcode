'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TOPIC_LABELS } from '@xeetcode/shared';
import type { TopicSelection } from '@xeetcode/shared';

import { useGame } from '@/components/GameProvider';
import { TopicPicker } from '@/components/TopicPicker';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { getPlayerName } from '@/lib/session';

/** Live "0:07" style counter, so waiting doesn't feel frozen. */
function ElapsedTime({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  return <span className="tabular-nums">{`${mm}:${ss}`}</span>;
}

export default function PlayOnlinePage() {
  const router = useRouter();
  const { status, error, connected, queuedSince, joinQueue, leaveQueue } = useGame();
  const [topic, setTopic] = useState<TopicSelection>('random');

  // Name is required upstream; if someone deep-links here, send them back.
  useEffect(() => {
    if (!getPlayerName()) router.replace('/');
  }, [router]);

  const queued = status === 'queued';

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-3xl font-bold text-accent-strong">Play Online</h1>

      {error && <ErrorNote message={error} />}

      <Panel className="flex flex-col gap-6">
        {queued ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Spinner label={`Searching for an opponent in ${TOPIC_LABELS[topic]}…`} />
            <p className="text-sm text-ink-faint">
              Waiting {queuedSince && <ElapsedTime since={queuedSince} />}
            </p>
            <p className="max-w-sm text-sm text-ink-faint">
              You&apos;ll be matched with the next player who picks {TOPIC_LABELS[topic]}. Keep this
              tab open.
            </p>
            <Button variant="ghost" onClick={leaveQueue}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <TopicPicker value={topic} onChange={setTopic} />
            <Button onClick={() => joinQueue(topic)} disabled={!connected}>
              {connected ? 'Find a match' : 'Connecting…'}
            </Button>
          </>
        )}
      </Panel>

      {!queued && (
        <Button variant="ghost" onClick={() => router.push('/')}>
          Back
        </Button>
      )}
    </main>
  );
}
