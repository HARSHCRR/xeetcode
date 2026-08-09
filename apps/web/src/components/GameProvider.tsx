'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import type {
  ChatMessagePayload,
  ClientToServerEvents,
  MatchEndPayload,
  MatchFoundPayload,
  ServerToClientEvents,
  SubmissionResultPayload,
  TopicSelection,
} from '@xeetcode/shared';

import { BACKEND_URL } from '@/lib/config';
import { clearStoredMatch, getPlayerId, getPlayerName, setStoredMatch } from '@/lib/session';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type GameStatus = 'idle' | 'queued' | 'hosting' | 'in_match';

/** Everything the match room needs that isn't the problem itself. */
export interface MatchView extends MatchFoundPayload {
  attemptCount: number;
  opponentAttemptCount: number;
  lastCode?: string;
}

interface GameState {
  connected: boolean;
  status: GameStatus;
  match: MatchView | null;
  result: MatchEndPayload | null;
  submission: SubmissionResultPayload | null;
  judging: boolean;
  chat: ChatMessagePayload[];
  opponentOnline: boolean;
  lobbyCode: string | null;
  error: string | null;
  queuedSince: number | null;
  joinQueue: (topic: TopicSelection) => void;
  leaveQueue: () => void;
  createLobby: (topic: TopicSelection) => void;
  joinLobby: (code: string) => void;
  submitCode: (code: string) => void;
  sendChat: (text: string) => void;
  leaveMatch: () => void;
  rejoinMatch: (matchId: string, userId: string) => void;
  reset: () => void;
}

const GameContext = createContext<GameState | null>(null);

/**
 * Owns the single socket connection and all cross-page match state.
 *
 * It lives above the router so the connection survives client-side navigation
 * into the match room — reconnecting on every route change would drop the
 * player out of the queue they just joined.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const socketRef = useRef<GameSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [match, setMatch] = useState<MatchView | null>(null);
  const [result, setResult] = useState<MatchEndPayload | null>(null);
  const [submission, setSubmission] = useState<SubmissionResultPayload | null>(null);
  const [judging, setJudging] = useState(false);
  const [chat, setChat] = useState<ChatMessagePayload[]>([]);
  const [opponentOnline, setOpponentOnline] = useState(true);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queuedSince, setQueuedSince] = useState<number | null>(null);

  useEffect(() => {
    const socket: GameSocket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () =>
      setError('Cannot reach the server. It may be waking up — this can take up to a minute.'),
    );

    socket.on('match:found', (payload) => {
      setMatch({ ...payload, attemptCount: 0, opponentAttemptCount: 0 });
      setResult(null);
      setSubmission(null);
      setChat([]);
      setOpponentOnline(true);
      setStatus('in_match');
      setLobbyCode(null);
      setQueuedSince(null);
      setStoredMatch({ matchId: payload.matchId, userId: payload.userId });
      router.push(`/match/${payload.matchId}`);
    });

    socket.on('match:state', (payload) => {
      setMatch({
        matchId: payload.matchId,
        userId: payload.userId,
        problem: payload.problem,
        opponentName: payload.opponentName,
        rating: payload.rating,
        opponentRating: payload.opponentRating,
        mode: payload.mode,
        startedAt: payload.startedAt,
        endsAt: payload.endsAt,
        attemptCount: payload.attemptCount,
        opponentAttemptCount: payload.opponentAttemptCount,
        ...(payload.lastCode ? { lastCode: payload.lastCode } : {}),
      });
      setChat(payload.chatHistory);
      setStatus('in_match');
    });

    socket.on('match:opponentSubmitted', ({ attemptCount }) => {
      setMatch((current) => (current ? { ...current, opponentAttemptCount: attemptCount } : current));
    });

    socket.on('match:submissionResult', (payload) => {
      setSubmission(payload);
      setJudging(false);
      setMatch((current) =>
        current ? { ...current, attemptCount: current.attemptCount + 1 } : current,
      );
    });

    socket.on('match:end', (payload) => {
      setResult(payload);
      setJudging(false);
      clearStoredMatch();
    });

    socket.on('chat:message', (message) => setChat((current) => [...current, message]));
    socket.on('opponent:disconnected', () => setOpponentOnline(false));
    socket.on('opponent:reconnected', () => setOpponentOnline(true));

    socket.on('lobby:created', ({ code }) => {
      setLobbyCode(code);
      setStatus('hosting');
    });

    socket.on('lobby:error', ({ message }) => {
      setError(message);
      setStatus('idle');
      setLobbyCode(null);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  const identity = useCallback(() => ({ playerId: getPlayerId(), name: getPlayerName() }), []);

  const joinQueue = useCallback(
    (topic: TopicSelection) => {
      setError(null);
      setStatus('queued');
      setQueuedSince(Date.now());
      socketRef.current?.emit('queue:join', { ...identity(), topic });
    },
    [identity],
  );

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('queue:leave');
    setStatus('idle');
    setQueuedSince(null);
  }, []);

  const createLobby = useCallback(
    (topic: TopicSelection) => {
      setError(null);
      socketRef.current?.emit('lobby:create', { ...identity(), topic });
    },
    [identity],
  );

  const joinLobby = useCallback(
    (code: string) => {
      setError(null);
      socketRef.current?.emit('lobby:join', { ...identity(), code });
    },
    [identity],
  );

  const submitCode = useCallback(
    (code: string) => {
      if (!match) return;
      setJudging(true);
      setSubmission(null);
      socketRef.current?.emit('match:submit', { matchId: match.matchId, code });
    },
    [match],
  );

  const sendChat = useCallback(
    (text: string) => {
      if (!match) return;
      socketRef.current?.emit('chat:message', { matchId: match.matchId, text });
    },
    [match],
  );

  const leaveMatch = useCallback(() => {
    if (match && !result) socketRef.current?.emit('match:leave', { matchId: match.matchId });
  }, [match, result]);

  const rejoinMatch = useCallback((matchId: string, userId: string) => {
    socketRef.current?.emit('match:rejoin', { matchId, userId });
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setMatch(null);
    setResult(null);
    setSubmission(null);
    setJudging(false);
    setChat([]);
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
      result,
      submission,
      judging,
      chat,
      opponentOnline,
      lobbyCode,
      error,
      queuedSince,
      joinQueue,
      leaveQueue,
      createLobby,
      joinLobby,
      submitCode,
      sendChat,
      leaveMatch,
      rejoinMatch,
      reset,
    }),
    [
      connected,
      status,
      match,
      result,
      submission,
      judging,
      chat,
      opponentOnline,
      lobbyCode,
      error,
      queuedSince,
      joinQueue,
      leaveQueue,
      createLobby,
      joinLobby,
      submitCode,
      sendChat,
      leaveMatch,
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
