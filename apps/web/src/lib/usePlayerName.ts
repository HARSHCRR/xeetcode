'use client';

import { useSyncExternalStore } from 'react';

import { getPlayerName, subscribeToPlayerName } from './session';

/**
 * Reads the persisted player name.
 *
 * `useSyncExternalStore` is the right tool here rather than reading
 * localStorage in an effect: it renders `''` during SSR via the server
 * snapshot and swaps to the stored value on hydration, so there's no mismatch
 * and no cascading re-render.
 */
export function usePlayerName(): string {
  return useSyncExternalStore(subscribeToPlayerName, getPlayerName, () => '');
}
