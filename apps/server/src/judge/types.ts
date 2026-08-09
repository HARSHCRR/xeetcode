import type { SubmissionResultPayload } from '@xeetcode/shared';

/** A judge's answer, before the socket layer attaches any cooldown. */
export type JudgeVerdict = Omit<SubmissionResultPayload, 'cooldownUntil'>;
