import { LearningData } from './types';

export type LearningPhase = 'input' | 'patterns' | 'retrieval' | 'communication';

/**
 * LÜ does not classify users by fixed learning styles.
 * The phase is an internal training state based on observed practice and retention.
 * It is a product heuristic, not a measurement of the user's brain or neural activity.
 */
export function getLearningPhase(data: LearningData): LearningPhase {
  const sessions = data.sessions ?? [];
  const results = data.gameResults ?? [];
  const retention = data.retention ?? [];

  if (sessions.length < 2) return 'input';

  const completed24 = retention.filter(r => r.horizon === 24 && r.completedAt !== null);
  const retention24 = completed24.length
    ? completed24.reduce((sum, r) => sum + (r.answers.length ? r.answers.filter(a => a.correct).length / r.answers.length : 0), 0) / completed24.length
    : 0;

  const completed7 = retention.filter(r => r.horizon === 168 && r.completedAt !== null);
  const retention7 = completed7.length
    ? completed7.reduce((sum, r) => sum + (r.answers.length ? r.answers.filter(a => a.correct).length / r.answers.length : 0), 0) / completed7.length
    : 0;

  const patternResults = results.filter(r => ['pattern', 'cognate', 'falsefriend'].includes(r.gameId));
  const patternAccuracy = patternResults.length
    ? patternResults.filter(r => r.correct).length / patternResults.length
    : 0;

  const productionResults = results.filter(r => r.production);
  const productionAccuracy = productionResults.length
    ? productionResults.filter(r => r.correct).length / productionResults.length
    : 0;

  if (retention24 < 0.60) return 'input';
  if (patternResults.length < 3 || patternAccuracy < 0.65) return 'patterns';
  if (productionResults.length < 4 || productionAccuracy < 0.70) return 'retrieval';

  // Communication is the most advanced phase: require evidence of delayed
  // retention instead of unlocking it only because enough games were played.
  if (completed7.length === 0 || retention7 < 0.65) return 'retrieval';
  return 'communication';
}

export const PHASE_INFO: Record<LearningPhase, { title: string; subtitle: string; description: string }> = {
  input: {
    title: 'Fase 1 · Explorador',
    subtitle: 'Comprender antes de producir',
    description: 'Priorizamos exposición, escucha, contexto e identificación del significado. La producción todavía no es el objetivo principal.',
  },
  patterns: {
    title: 'Fase 2 · Detective estadístico',
    subtitle: 'Encontrar regularidades',
    description: 'LÜ empieza a presentar patrones lingüísticos repetidos en contextos variados para que puedas detectarlos y usarlos.',
  },
  retrieval: {
    title: 'Fase 3 · Campo de tiro',
    subtitle: 'Recuperar y producir',
    description: 'Aumentamos la recuperación activa y la producción breve. La presión aparece solo en tareas cortas y medibles.',
  },
  communication: {
    title: 'Fase 4 · Supervivencia',
    subtitle: 'Comunicar con los recursos disponibles',
    description: 'Entrenamos producción espontánea, circunloquio y resolución de situaciones cuando no recuerdas una palabra.',
  },
};

export function getAllowedGameIds(phase: LearningPhase): string[] {
  const input = ['audio', 'context', 'story', 'pairs', 'definition', 'reverse'];
  const patterns = ['pattern', 'cognate', 'falsefriend', 'grammar'];
  const retrieval = ['flash', 'speed', 'sentence', 'shadow', 'mixed'];
  const communication = ['challenge', 'taboo', 'survival'];

  if (phase === 'input') return input;
  if (phase === 'patterns') return [...input, ...patterns];
  if (phase === 'retrieval') return [...input, ...patterns, ...retrieval];
  return [...input, ...patterns, ...retrieval, ...communication];
}

export function isGameUnlocked(gameId: string, phase: LearningPhase): boolean {
  return getAllowedGameIds(phase).includes(gameId);
}
