'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import type {
  ClientToServerEvents,
  MatchFoundPayload,
  ServerToClientEvents,
  TopicSelection,
} from '@xeetcode/shared';

import { BACKEND_URL } from '@/lib/config';
import { clearStoredMatch, getPlayerName, setStoredMatch } from '@/lib/session';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type GameStatus = 'idle' | 'queued' | 'hosting' | 'in_match';

interface GameState {
  connected: boolean;
  status: GameStatus;
  match: MatchFoundPayload | null;
  lobbyCode: string | null;
  error: string | null;
  queuedSince: number | null;
  joinQueue: (topic: TopicSelection) => void;
  leaveQueue: () => void;
  createLobby: (topic: TopicSelection) => void;
  joinLobby: (code: string) => void;
  rejoinMatch: (matchId: string, userId: string) => void;
  clearError: () => void;
  reset: () => void;
}

const GameContext = createContext<GameState | null>(null);

/**
 * Owns the single socket connection and all cross-page match state.
 *
 * It lives above the router so the connection survives client-side navigation
 * to `/match/[id]` — reconnecting on every route change would drop the player
 * out of the queue they just joined.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const socketRef = useRef<GameSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [match, setMatch] = useState<MatchFoundPayload | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queuedSince, setQueuedSince] = useState<number | null>(null);

  useEffect(() => {
    const socket: GameSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () =>
      setError('Cannot reach the server. It may be waking up — this can take up to a minute.'),
    );

    socket.on('match:found', (payload) => {
      setMatch(payload);
      setStatus('in_match');
      setLobbyCode(null);
      setQueuedSince(null);
      setStoredMatch({ matchId: payload.matchId, userId: payload.userId });
      router.push(`/match/${payload.matchId}`);
    });

    socket.on('lobby:created', ({ code }) => {
      setLobbyCode(code);
      setStatus('hosting');
    });

    socket.on('lobby:error', ({ message }) => {
      setError(message);
      setStatus('idle');
      setLobbyCode(null);
    });

    socket.on('match:state', (payload) => {
      // Rejoin after a refresh: rebuild what `match:found` would have given us.
      setMatch({
        matchId: payload.matchId,
        userId: '',
        problem: payload.problem,
        opponentName: payload.opponentName,
        mode: payload.mode,
        startedAt: payload.startedAt,
        endsAt: payload.endsAt,
      });
      setStatus('in_match');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  const joinQueue = useCallback((topic: TopicSelection) => {
    setError(null);
    setStatus('queued');
    setQueuedSince(Date.now());
    socketRef.current?.emit('queue:join', { name: getPlayerName(), topic });
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('queue:leave');
    setStatus('idle');
    setQueuedSince(null);
  }, []);

  const createLobby = useCallback((topic: TopicSelection) => {
    setError(null);
    socketRef.current?.emit('lobby:create', { name: getPlayerName(), topic });
  }, []);

  const joinLobby = useCallback((code: string) => {
    setError(null);
    socketRef.current?.emit('lobby:join', { name: getPlayerName(), code });
  }, []);

  const rejoinMatch = useCallback((matchId: string, userId: string) => {
    socketRef.current?.emit('match:rejoin', { matchId, userId });
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setMatch(null);
    setLobbyCode(null);
    setQueuedSince(null);
    setError(null);
    clearStoredMatch();
  }, []);

  const value = useMemo<GameState>(
    () => ({
      connected,
      status,
      match,
      lobbyCode,
      error,
      queuedSince,
      joinQueue,
      leaveQueue,
      createLobby,
      joinLobby,
      rejoinMatch,
      clearError: () => setError(null),
      reset,
    }),
    [
      connected,
      status,
      match,
      lobbyCode,
      error,
      queuedSince,
      joinQueue,
      leaveQueue,
      createLobby,
      joinLobby,
      rejoinMatch,
      reset,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside <GameProvider>');
  return context;
}
