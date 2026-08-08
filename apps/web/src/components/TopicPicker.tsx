'use client';

import { TOPIC_LABELS, TOPIC_SELECTIONS } from '@xeetcode/shared';
import type { TopicSelection } from '@xeetcode/shared';

const HINTS: Record<TopicSelection, string> = {
  arrays: 'Two pointers, sliding windows, in-place tricks',
  strings: 'Parsing, counting, character bookkeeping',
  binary_search: 'Sorted data, boundaries, logarithmic time',
  random: 'Anything from the full problem bank',
};

export function TopicPicker({
  value,
  onChange,
}: {
  value: TopicSelection;
  onChange: (topic: TopicSelection) => void;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Choose a topic</legend>
      {TOPIC_SELECTIONS.map((topic) => {
        const selected = topic === value;
        return (
          <button
            key={topic}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(topic)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              selected
                ? 'border-accent bg-accent-soft'
                : 'border-edge bg-surface-raised hover:border-accent'
            }`}
          >
            <span className="block font-medium text-ink">{TOPIC_LABELS[topic]}</span>
            <span className="mt-1 block text-sm text-ink-faint">{HINTS[topic]}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
