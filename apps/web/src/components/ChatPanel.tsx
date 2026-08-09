'use client';

import { useEffect, useRef, useState } from 'react';

import type { ChatMessagePayload } from '@xeetcode/shared';

/**
 * In-match chat with a collapse toggle.
 *
 * Collapsed state is remembered for the session, because a player who hides
 * chat to focus almost certainly wants it hidden in the next match too.
 */
export function ChatPanel({
  messages,
  selfUserId,
  onSend,
  collapsed,
  onToggle,
}: {
  messages: ChatMessagePayload[];
  selfUserId: string;
  onSend: (text: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const unreadRef = useRef(0);

  useEffect(() => {
    if (!collapsed) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, collapsed]);

  // Track messages that arrived while hidden, so the toggle can show a count.
  useEffect(() => {
    if (collapsed) unreadRef.current = messages.length;
  }, [collapsed, messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-t border-edge bg-surface px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        aria-expanded={false}
      >
        <span>Chat</span>
        <span className="text-ink-faint">Show</span>
      </button>
    );
  }

  return (
    <section className="flex min-h-0 flex-col border-t border-edge bg-surface" aria-label="Match chat">
      <button
        onClick={onToggle}
        className="flex shrink-0 items-center justify-between px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        aria-expanded
      >
        <span>Chat</span>
        <span className="text-ink-faint">Hide</span>
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-2">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-faint">Say hello to your opponent.</p>
        ) : (
          messages.map((message, index) => {
            const mine = message.fromUserId === selfUserId;
            return (
              <div key={`${message.timestamp}-${index}`} className={mine ? 'text-right' : ''}>
                <span className="text-xs text-ink-faint">{mine ? 'You' : message.from}</span>
                <p
                  className={`inline-block max-w-[85%] break-words rounded-lg px-3 py-1.5 text-sm ${
                    mine ? 'bg-accent-soft text-ink' : 'bg-surface-raised text-ink'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex shrink-0 gap-2 border-t border-edge p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
          maxLength={500}
          placeholder="Message…"
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-md border border-edge bg-surface-raised px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="rounded-md bg-surface-raised px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </section>
  );
}
