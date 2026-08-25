/**
 * SM-2 Algorithm Implementation for Spaced Repetition
 * 
 * SM-2 is the classic spaced repetition algorithm used by Anki, SuperMemo, etc.
 * 
 * Key concepts:
 * - easiness factor (EF): starts at 2.5, adjusted based on quality of recall
 * - interval: days until next review
 * - repetitions: number of successful recalls in a row
 * - quality: 0-5 rating of recall quality (0=complete blackout, 5=perfect recall)
 * 
 * Quality grades:
 * 0 - Complete blackout (no recall)
 * 1 - Incorrect response, but remembered after seeing answer
 * 2 - Incorrect response, but felt familiar
 * 3 - Correct with difficulty
 * 4 - Correct with slight hesitation
 * 5 - Perfect response
 */

export interface SM2State {
  /** Easiness factor, minimum 1.3, starts at 2.5 */
  easinessFactor: number;
  /** Number of consecutive successful recalls */
  repetitions: number;
  /** Days until next review */
  interval: number;
  /** Next review date (YYYY-MM-DD) */
  nextReview: string;
  /** Whether the card is mature (graduated) */
  isMature: boolean;
}

/** Quality rating from 0-5 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/** Default SM-2 initial state */
export const INITIAL_SM2_STATE: SM2State = {
  easinessFactor: 2.5,
  repetitions: 0,
  interval: 0,
  nextReview: '',
  isMature: false,
};

/**
 * Calculate next review state using SM-2 algorithm
 * 
 * @param state Current SM-2 state
 * @param quality Quality of recall (0-5)
 * @param today Today's date in YYYY-MM-DD format
 * @returns Updated SM-2 state
 */
export function calculateSM2Next(
  state: SM2State,
  quality: SM2Quality,
  today: string
): SM2State {
  let { easinessFactor, repetitions, interval } = state;
  let nextReview: string;

  if (quality < 3) {
    // Failed recall - reset repetitions, short interval
    return {
      easinessFactor: Math.max(1.3, easinessFactor - 0.2),
      repetitions: 0,
      interval: 1,
      nextReview: addDays(new Date(), 1).toISOString().split('T')[0],
      isMature: false,
    };
  }

  // Successful recall
  const newRepetitions = state.repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(state.interval * state.easinessFactor);
  }

  // Cap interval at 365 days
  const cappedInterval = Math.min(newInterval, 365);

  // Adjust easiness factor based on quality
  // EF' = EF + (0.1 - (5-quality)*(0.08 + (5-quality)*0.02))
  const q = quality;
  const newEasinessFactor = Math.max(1.3, easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // Next review date
  const nextReviewDate = addDays(new Date(), newInterval);

  return {
    easinessFactor: newEasinessFactor,
    repetitions: newRepetitions,
    interval: Math.round(state.interval === 0 ? 1 : newInterval), // First interval is 1 day
    nextReview: nextReviewDate.toISOString().split('T')[0],
    isMature: newRepetitions >= 4,
  };
}

/**
 * Convert a simple 0-1 correct/incorrect to SM-2 quality
 * - correct: true -> quality 4 (correct with slight hesitation)
 * - correct: false -> quality 1 (incorrect but remembered after seeing answer)
 */
export function binaryToQuality(correct: boolean): 1 | 4 {
  return correct ? 4 : 1;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return formatDate(new Date());
}

/**
 * Add days to a date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  return formatDate(addDays(date, days));
}