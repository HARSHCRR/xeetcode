/**
 * Browser-local identity. There's no auth yet (by design for this phase), so a
 * "session" is just a display name the player typed, kept across reloads.
 *
 * The in-match identity (`userId`) is assigned by the server on `match:found`
 * and stored separately, so a refresh mid-match can rejoin.
 */

const NAME_KEY = 'xeetcode:name';
const MATCH_KEY = 'xeetcode:match';
const PLAYER_ID_KEY = 'xeetcode:playerId';

export interface StoredMatch {
  matchId: string;
  userId: string;
}

/** Safe on the server, where localStorage doesn't exist. */
function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private browsing modes can throw on access.
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not being able to persist is survivable; the session just won't resume.
  }
}

function clearStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

/**
 * Stable identity for this browser, minted once and reused forever.
 *
 * This is what ties a player to their Elo across matches. It's not a security
 * boundary — anyone can invent one — but there's no auth in this phase, and a
 * rating that resets every visit would be meaningless.
 */
export function getPlayerId(): string {
  const existing = readStorage(PLAYER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : // Older Safari: good enough for a non-security identifier.
        `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

  writeStorage(PLAYER_ID_KEY, id);
  return id;
}

export const getPlayerName = (): string => readStorage(NAME_KEY) ?? '';

/**
 * Listeners for `useSyncExternalStore`. The native `storage` event only fires
 * in *other* tabs, so writes from this tab have to notify explicitly.
 */
const nameListeners = new Set<() => void>();

export function setPlayerName(name: string): void {
  writeStorage(NAME_KEY, name);
  for (const listener of nameListeners) listener();
}

export function subscribeToPlayerName(onChange: () => void): () => void {
  nameListeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    nameListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getStoredMatch(): StoredMatch | null {
  const raw = readStorage(MATCH_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as StoredMatch).matchId === 'string' &&
      typeof (parsed as StoredMatch).userId === 'string'
    ) {
      return parsed as StoredMatch;
    }
  } catch {
    // Corrupt entry — treat as absent.
  }
  return null;
}

export const setStoredMatch = (match: StoredMatch): void =>
  writeStorage(MATCH_KEY, JSON.stringify(match));

export const clearStoredMatch = (): void => clearStorage(MATCH_KEY);
