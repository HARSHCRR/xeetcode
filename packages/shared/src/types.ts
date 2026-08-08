/**
 * Shared domain + socket contract types.
 *
 * This file is the single source of truth for the client/server wire format.
 * Both `@xeetcode/web` and `@xeetcode/server` import from here, so a change to
 * an event payload is a compile error on whichever side hasn't caught up.
 */

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

/** Topics a problem can belong to. `random` is a queue selection, not a topic. */
export const PROBLEM_TOPICS = ['arrays', 'strings', 'binary_search'] as const;
export type ProblemTopic = (typeof PROBLEM_TOPICS)[number];

/** What a player can pick before queueing. `random` draws from every topic. */
export const TOPIC_SELECTIONS = [...PROBLEM_TOPICS, 'random'] as const;
export type TopicSelection = (typeof TOPIC_SELECTIONS)[number];

export type Difficulty = 'easy' | 'medium' | 'hard';

export type MatchMode = 'online' | 'friend';

export type MatchStatus = 'completed' | 'draw' | 'abandoned';

export type MatchResult = 'win' | 'loss' | 'draw' | 'forfeit';

/**
 * The public view of a problem — what gets sent to the browser.
 * Deliberately has no `testCases` field: hidden tests never leave the server.
 */
export interface PublicProblem {
  id: string;
  slug: string;
  title: string;
  topic: ProblemTopic;
  difficulty: Difficulty;
  /** Markdown. */
  description: string;
  functionSignature: string;
  starterCode: string;
}

// ---------------------------------------------------------------------------
// Client -> Server events
// ---------------------------------------------------------------------------

export interface QueueJoinPayload {
  name: string;
  topic: TopicSelection;
}

export interface LobbyCreatePayload {
  name: string;
  topic: TopicSelection;
}

export interface LobbyJoinPayload {
  name: string;
  code: string;
}

export interface MatchSubmitPayload {
  matchId: string;
  code: string;
}

export interface ChatSendPayload {
  matchId: string;
  text: string;
}

export interface MatchRejoinPayload {
  matchId: string;
  userId: string;
}

export interface MatchLeavePayload {
  matchId: string;
}

export interface ClientToServerEvents {
  'queue:join': (payload: QueueJoinPayload) => void;
  'queue:leave': () => void;
  'lobby:create': (payload: LobbyCreatePayload) => void;
  'lobby:join': (payload: LobbyJoinPayload) => void;
  'match:submit': (payload: MatchSubmitPayload) => void;
  'match:rejoin': (payload: MatchRejoinPayload) => void;
  'match:leave': (payload: MatchLeavePayload) => void;
  'chat:message': (payload: ChatSendPayload) => void;
}

// ---------------------------------------------------------------------------
// Server -> Client events
// ---------------------------------------------------------------------------

export interface LobbyCreatedPayload {
  code: string;
}

export interface LobbyErrorPayload {
  message: string;
}

export interface QueueWaitingPayload {
  topic: TopicSelection;
  /** How many players are queued for this topic, including the caller. */
  queueSize: number;
}

export interface MatchFoundPayload {
  matchId: string;
  /** Identity assigned by the server; the client persists this to rejoin. */
  userId: string;
  problem: PublicProblem;
  opponentName: string;
  mode: MatchMode;
  /** Epoch ms. */
  startedAt: number;
  /** Epoch ms. The server is authoritative; the client only renders a countdown. */
  endsAt: number;
}

/** Sent to the opponent. Carries no code and no pass/fail signal. */
export interface OpponentSubmittedPayload {
  attemptCount: number;
}

/** Sent only to the player who submitted. */
export interface SubmissionResultPayload {
  passed: boolean;
  passedCount: number;
  totalCount: number;
  /** 1-based index of the first failing test. Never includes its input/output. */
  failedTestIndex?: number;
  /** Sanitized, e.g. "Runtime error" or "Time limit exceeded". */
  errorKind?: 'runtime_error' | 'timeout' | 'compile_error';
  /** Epoch ms before which further submissions are rejected. */
  cooldownUntil?: number;
}

export interface MatchStatePayload {
  matchId: string;
  problem: PublicProblem;
  opponentName: string;
  mode: MatchMode;
  startedAt: number;
  endsAt: number;
  attemptCount: number;
  opponentAttemptCount: number;
  chatHistory: ChatMessagePayload[];
}

export interface MatchEndPayload {
  matchId: string;
  result: MatchResult;
  status: MatchStatus;
  winnerId: string | null;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

export interface ChatMessagePayload {
  from: string;
  text: string;
  /** Epoch ms. */
  timestamp: number;
}

export interface OpponentDisconnectedPayload {
  gracePeriodMs: number;
}

export interface ServerToClientEvents {
  'queue:waiting': (payload: QueueWaitingPayload) => void;
  'lobby:created': (payload: LobbyCreatedPayload) => void;
  'lobby:error': (payload: LobbyErrorPayload) => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'match:state': (payload: MatchStatePayload) => void;
  'match:opponentSubmitted': (payload: OpponentSubmittedPayload) => void;
  'match:submissionResult': (payload: SubmissionResultPayload) => void;
  'match:end': (payload: MatchEndPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
  'opponent:disconnected': (payload: OpponentDisconnectedPayload) => void;
  'opponent:reconnected': () => void;
}
