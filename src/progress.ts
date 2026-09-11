import { LearningData } from './types';

export type ProgressSummary = {
  xp: number;
  level: number;
  levelTitle: string;
  levelXp: number;
  nextLevelXp: number;
  levelProgress: number;
  wordsPracticed: number;
  wordsMastered: number;
  retentionCompleted: number;
  sessions: number;
  streak: number;
  badges: string[];
};

const LEVELS = [
  { xp: 0, title: 'Exploradora' },
  { xp: 100, title: 'Descubridora' },
  { xp: 250, title: 'Aprendiz' },
  { xp: 500, title: 'Practicante' },
  { xp: 900, title: 'Consolidada' },
  { xp: 1400, title: 'Políglota en camino' },
];

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getProgress(data: LearningData, languagePairId?: string): ProgressSummary {
  const sessions = languagePairId ? data.sessions.filter((s) => !s.languagePairId || s.languagePairId === languagePairId) : data.sessions;
  const retention = languagePairId ? data.retention.filter((r) => !r.languagePairId || r.languagePairId === languagePairId) : data.retention;
  const immediateCorrect = sessions.reduce((sum, session) => sum + session.answers.filter((a) => a.correct).length, 0);
  const retentionCorrect = retention.reduce((sum, record) => sum + record.answers.filter((a) => a.correct).length, 0);
  const retentionCompleted = retention.filter((r) => r.completedAt !== null).length;
  const wordsPracticed = new Set(sessions.flatMap((session) => session.answers.map((a) => a.wordId))).size;
  const mastered = new Set(retention.flatMap((record) => record.answers.filter((a) => a.correct).map((a) => a.wordId))).size;

  const xp = immediateCorrect * 5 + retentionCorrect * 12 + sessions.length * 10 + retentionCompleted * 15;
  let levelIndex = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (xp >= LEVELS[i].xp) levelIndex = i;
  const current = LEVELS[levelIndex];
  const next = LEVELS[Math.min(levelIndex + 1, LEVELS.length - 1)];
  const range = Math.max(1, next.xp - current.xp);
  const levelProgress = levelIndex === LEVELS.length - 1 ? 1 : Math.min(1, (xp - current.xp) / range);

  const days = [...new Set(sessions.map((s) => dayKey(s.createdAt)))];
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = dayKey(date.getTime());
    if (days.includes(key)) streak += 1;
    else if (i === 0) continue;
    else break;
  }

  const badges: string[] = [];
  if (sessions.length >= 1) badges.push('🌙 Primera sesión');
  if (sessions.length >= 3) badges.push('✨ Constancia');
  if (retentionCompleted >= 1) badges.push('🧠 Memoria comprobada');
  if (retentionCompleted >= 2) badges.push('🔭 Retención');
  if (mastered >= 5) badges.push('💜 5 palabras recordadas');
  if (streak >= 3) badges.push('🔥 Racha de 3 días');

  return { xp, level: levelIndex + 1, levelTitle: current.title, levelXp: current.xp, nextLevelXp: next.xp, levelProgress, wordsPracticed, wordsMastered: mastered, retentionCompleted, sessions: sessions.length, streak, badges };
}
