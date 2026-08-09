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

/** Human-readable topic names, so the UI never hardcodes its own copies. */
export const TOPIC_LABELS: Record<TopicSelection, string> = {
  arrays: 'Arrays',
  strings: 'Strings',
  binary_search: 'Binary Search',
  random: 'Random',
};

/** Narrows untrusted client input to a valid topic selection. */
export function isTopicSelection(value: unknown): value is TopicSelection {
  return typeof value === 'string' && (TOPIC_SELECTIONS as readonly string[]).includes(value);
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * A single hidden test case. Never sent to the browser — it lives in the
 * database and is only read inside the judge (Phase 3).
 */
export interface TestCase {
  /** Positional arguments applied to the solution function. */
  input: unknown[];
  expected: unknown;
}

/** Full server-side problem, including the hidden tests. */
export interface Problem extends PublicProblem {
  testCases: TestCase[];
}

/**
 * Narrows a problem to the fields safe to send to the browser.
 *
 * Deliberately an explicit allow-list rather than "spread and delete
 * testCases": if a future field holds something secret, forgetting to exclude
 * it would leak it to both players. This way a new field is invisible to the
 * client until someone consciously adds it here.
 */
export function toPublicProblem(problem: Problem): PublicProblem {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    description: problem.description,
    functionSignature: problem.functionSignature,
    starterCode: problem.starterCode,
  };
}

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

/**
 * Identity the browser carries into every entry point.
 *
 * `playerId` is generated once and kept in localStorage, so a returning player
 * keeps their rating across matches. It's not a security boundary — there's no
 * auth yet — just a stable handle for their Elo.
 */
export interface PlayerIdentity {
  playerId: string;
  name: string;
}

export interface QueueJoinPayload extends PlayerIdentity {
  topic: TopicSelection;
}

export interface LobbyCreatePayload extends PlayerIdentity {
  topic: TopicSelection;
}

export interface LobbyJoinPayload extends PlayerIdentity {
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
  /** Echoes the caller's `playerId`; persisted client-side to rejoin. */
  userId: string;
  problem: PublicProblem;
  opponentName: string;
  rating: number;
  opponentRating: number;
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
  userId: string;
  problem: PublicProblem;
  opponentName: string;
  rating: number;
  opponentRating: number;
  mode: MatchMode;
  startedAt: number;
  endsAt: number;
  attemptCount: number;
  opponentAttemptCount: number;
  /** The player's last submitted source, so a refresh doesn't lose their work. */
  lastCode?: string;
  chatHistory: ChatMessagePayload[];
}

export interface MatchEndPayload {
  matchId: string;
  result: MatchResult;
  status: MatchStatus;
  winnerId: string | null;
  /** Name of whoever solved it, for the result screen. */
  winnerName: string | null;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

export interface ChatMessagePayload {
  /** Sender's playerId, so the client can tell its own messages apart. */
  fromUserId: string;
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
