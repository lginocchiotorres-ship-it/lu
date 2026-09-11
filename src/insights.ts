import { LearningData, Strategy } from './types';
import { getStats, strategyScore } from './adaptive';

export type LearningInsight = {
  title: string;
  detail: string;
  confidence: 'baja' | 'media' | 'alta';
};

const LABEL: Record<Strategy, string> = {
  context: 'Contexto',
  audio: 'Audio',
  retrieval: 'Recuperación',
};

/** User-facing observations. They describe app performance, not brain measurements. */
export function getLearningInsights(data: LearningData): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const stats = getStats(data);
  const strategies: Strategy[] = ['context', 'audio', 'retrieval'];

  const ranked = strategies
    .map(strategy => ({ strategy, score: strategyScore(stats[strategy]) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const bestStats = stats[best.strategy];
  const bestEvidence = bestStats.attempts + bestStats.retention24Total + bestStats.retention7Total;

  if (bestEvidence >= 8) {
    insights.push({
      title: `${LABEL[best.strategy]} está funcionando mejor por ahora`,
      detail: `Tus resultados observados son mejores con ${LABEL[best.strategy].toLowerCase()}. LÜ la priorizará, pero seguirá probando otras estrategias para comprobarlo.`,
      confidence: bestEvidence >= 20 ? 'alta' : 'media',
    });
  }

  const retention24Total = strategies.reduce((n, s) => n + stats[s].retention24Total, 0);
  const retention7Total = strategies.reduce((n, s) => n + stats[s].retention7Total, 0);
  if (retention7Total >= 3) {
    const seven = strategies.reduce((n, s) => n + stats[s].retention7Correct, 0) / Math.max(1, retention7Total);
    insights.push({
      title: seven >= 0.75 ? 'Tu retención a 7 días es sólida' : 'LÜ necesita reforzar tu retención a 7 días',
      detail: `En las mediciones disponibles, recuerdas aproximadamente ${Math.round(seven * 100)}% de las respuestas a 7 días.`,
      confidence: retention7Total >= 10 ? 'alta' : 'media',
    });
  } else if (retention24Total >= 3) {
    insights.push({
      title: 'LÜ todavía está midiendo tu memoria a largo plazo',
      detail: 'Ya hay datos de 24 horas, pero hacen falta más mediciones de 7 días para sacar una conclusión más estable.',
      confidence: 'baja',
    });
  }

  const exploration = ranked.some(({ strategy }) => stats[strategy].attempts < 8);
  if (exploration) {
    insights.push({
      title: 'Tu perfil todavía está en descubrimiento',
      detail: 'LÜ seguirá alternando estrategias con pocas observaciones antes de decidir que una es claramente mejor para ti.',
      confidence: 'alta',
    });
  }

  return insights.slice(0, 4);
}
