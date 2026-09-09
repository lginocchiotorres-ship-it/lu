import { LearningData, Strategy, StrategyStats } from './types';

export const STRATEGY_KEYS: Strategy[] = ['context', 'audio', 'retrieval'];

export function getStats(data: LearningData): Record<Strategy, StrategyStats> {
  const stats: Record<Strategy, StrategyStats> = {
    context: { attempts: 0, correct: 0, totalResponseMs: 0, totalHints: 0, retention24Correct: 0, retention24Total: 0, retention7Correct: 0, retention7Total: 0 },
    audio: { attempts: 0, correct: 0, totalResponseMs: 0, totalHints: 0, retention24Correct: 0, retention24Total: 0, retention7Correct: 0, retention7Total: 0 },
    retrieval: { attempts: 0, correct: 0, totalResponseMs: 0, totalHints: 0, retention24Correct: 0, retention24Total: 0, retention7Correct: 0, retention7Total: 0 },
  };

  data.sessions.forEach((session) => session.answers.forEach((answer) => addAnswer(stats[answer.strategy], answer)));
  data.retention.forEach((record) => record.answers.forEach((answer) => {
    const s = stats[answer.strategy];
    if (record.horizon === 24) { s.retention24Total += 1; if (answer.correct) s.retention24Correct += 1; }
    if (record.horizon === 168) { s.retention7Total += 1; if (answer.correct) s.retention7Correct += 1; }
  }));
  return stats;
}

function addAnswer(stat: StrategyStats, answer: { correct: boolean; responseMs: number; hints: number }) {
  stat.attempts += 1;
  if (answer.correct) stat.correct += 1;
  stat.totalResponseMs += answer.responseMs;
  stat.totalHints += answer.hints;
}

function rate(correct: number, total: number) {
  return total === 0 ? null : correct / total;
}

export function strategyScore(stats: StrategyStats) {
  const immediate = rate(stats.correct, stats.attempts) ?? 0.5;
  const r24 = rate(stats.retention24Correct, stats.retention24Total) ?? immediate;
  const r7 = rate(stats.retention7Correct, stats.retention7Total) ?? r24;
  const speed = stats.attempts === 0 ? 0.5 : Math.max(0, Math.min(1, 1 - (stats.totalResponseMs / stats.attempts - 1800) / 7000));
  const hintPenalty = stats.attempts === 0 ? 0 : Math.min(0.15, (stats.totalHints / stats.attempts) * 0.03);

  // Retention receives more weight because LÜ's goal is durable learning, not only immediate accuracy.
  return Math.max(0, 100 * (immediate * 0.25 + r24 * 0.30 + r7 * 0.35 + speed * 0.10 - hintPenalty));
}

export function adaptiveOrder(data: LearningData): Strategy[] {
  const stats = getStats(data);
  const ranked = [...STRATEGY_KEYS].sort((a, b) => strategyScore(stats[a]) - strategyScore(stats[b]));

  // Exploration rule: if a strategy has very little evidence, keep it near the front
  // so the system does not prematurely lock onto one strategy.
  const underObserved = ranked.filter((key) => stats[key].attempts < 8);
  const observed = ranked.filter((key) => stats[key].attempts >= 8);
  return [...underObserved, ...observed];
}

export function bestStrategy(data: LearningData): Strategy | null {
  if (data.sessions.length === 0) return null;
  const stats = getStats(data);
  return [...STRATEGY_KEYS].sort((a, b) => strategyScore(stats[b]) - strategyScore(stats[a]))[0];
}

export function dueRetention(data: LearningData) {
  const now = Date.now();
  return data.retention.find((record) => record.completedAt === null && record.dueAt <= now) ?? null;
}

export function createRetentionRecord(sessionId: string, createdAt: number, horizon: 24 | 168) {
  return {
    sessionId,
    dueAt: createdAt + horizon * 60 * 60 * 1000,
    completedAt: null,
    horizon,
    answers: [],
  } as const;
}
