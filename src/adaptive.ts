import { LearningData, Strategy, StrategyStats } from './types';

export const STRATEGY_KEYS: Strategy[] = ['context', 'audio', 'retrieval'];

const emptyStats = (): StrategyStats => ({ attempts: 0, correct: 0, totalResponseMs: 0, totalHints: 0, retention24Correct: 0, retention24Total: 0, retention7Correct: 0, retention7Total: 0 });

function gameToStrategy(gameId: string): Strategy | null {
  if (['audio', 'shadow'].includes(gameId)) return 'audio';
  if (['context', 'story', 'pattern', 'cognate', 'falsefriend', 'grammar', 'taboo', 'survival'].includes(gameId)) return 'context';
  if (['pairs', 'definition', 'flash', 'speed', 'sentence', 'mixed', 'challenge', 'reverse'].includes(gameId)) return 'retrieval';
  return null;
}

export function getStats(data: LearningData): Record<Strategy, StrategyStats> {
  const stats: Record<Strategy, StrategyStats> = { context: emptyStats(), audio: emptyStats(), retrieval: emptyStats() };
  data.sessions.forEach(session => session.answers.forEach(answer => {
    const stat = stats[answer.strategy];
    stat.attempts += 1;
    if (answer.correct) stat.correct += 1;
    stat.totalResponseMs += answer.responseMs;
    stat.totalHints += answer.hints;
  }));
  data.retention.forEach(record => record.answers.forEach(answer => {
    const stat = stats[answer.strategy];
    if (record.horizon === 24) { stat.retention24Total += 1; if (answer.correct) stat.retention24Correct += 1; }
    if (record.horizon === 168) { stat.retention7Total += 1; if (answer.correct) stat.retention7Correct += 1; }
  }));
  (data.gameResults ?? []).forEach(result => {
    if (result.production) return;
    const strategy = gameToStrategy(result.gameId);
    if (!strategy) return;
    const stat = stats[strategy];
    stat.attempts += 1;
    if (result.correct) stat.correct += 1;
    stat.totalResponseMs += result.responseMs;
    if (result.helpUsed) stat.totalHints += 1;
  });
  return stats;
}

function smoothedRate(correct: number, total: number, prior = 0.5) { return (correct + prior * 2) / (total + 2); }

export function strategyScore(stat: StrategyStats) {
  const immediate = smoothedRate(stat.correct, stat.attempts);
  const r24 = stat.retention24Total ? smoothedRate(stat.retention24Correct, stat.retention24Total) : immediate;
  const r7 = stat.retention7Total ? smoothedRate(stat.retention7Correct, stat.retention7Total) : r24;
  const averageMs = stat.attempts ? stat.totalResponseMs / stat.attempts : 4000;
  const speed = Math.max(0, Math.min(1, 1 - Math.max(0, averageMs - 1500) / 7000));
  const hintRate = stat.attempts ? stat.totalHints / stat.attempts : 0;
  const hintPenalty = Math.min(0.12, hintRate * 0.025);
  return Math.round(Math.max(0, Math.min(100, 100 * (immediate * 0.20 + r24 * 0.30 + r7 * 0.40 + speed * 0.10 - hintPenalty))));
}

export function strategyEvidence(stat: StrategyStats) { return stat.attempts + stat.retention24Total + stat.retention7Total; }
export function strategyLabel(strategy: Strategy) { return strategy === 'context' ? 'Contexto' : strategy === 'audio' ? 'Audio' : 'Recuperación'; }

export function adaptiveOrder(data: LearningData): Strategy[] {
  const stats = getStats(data);
  const scored = STRATEGY_KEYS.map(key => ({ key, score: strategyScore(stats[key]), observations: stats[key].attempts, evidence: strategyEvidence(stats[key]) }));
  const unexplored = scored.filter(item => item.observations < 8).sort((a, b) => a.observations - b.observations || a.evidence - b.evidence);
  if (unexplored.length > 0) {
    const explored = scored.filter(item => item.observations >= 8).sort((a, b) => b.score - a.score);
    return [...unexplored, ...explored].slice(0, 3).map(item => item.key);
  }
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const leader = ranked[0];
  const runnerUp = ranked[1];
  if (leader.evidence < 20 || leader.score - runnerUp.score < 5) return ranked.map(item => item.key);
  return [leader.key, runnerUp.key, leader.key];
}

export function bestStrategy(data: LearningData): Strategy | null {
  const stats = getStats(data);
  if (!STRATEGY_KEYS.some(strategy => strategyEvidence(stats[strategy]) > 0)) return null;
  return [...STRATEGY_KEYS].sort((a, b) => strategyScore(stats[b]) - strategyScore(stats[a]))[0];
}

export function dueRetention(data: LearningData) {
  const now = Date.now();
  return data.retention.filter(record => record.completedAt === null && record.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)[0] ?? null;
}

export function createRetentionRecord(sessionId: string, createdAt: number, horizon: 24 | 168) {
  return { sessionId, dueAt: createdAt + horizon * 60 * 60 * 1000, completedAt: null, horizon, answers: [] } as const;
}
