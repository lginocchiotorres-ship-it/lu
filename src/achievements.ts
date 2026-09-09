export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  category: 'inicio' | 'constancia' | 'memoria' | 'exploracion';
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-session', icon: '🌙', title: 'Primera noche', description: 'Completa tu primera sesión con LÜ.', target: 1, category: 'inicio' },
  { id: 'three-sessions', icon: '✨', title: 'En marcha', description: 'Completa 3 sesiones de aprendizaje.', target: 3, category: 'constancia' },
  { id: 'five-sessions', icon: '🚀', title: 'Sin detenerte', description: 'Completa 5 sesiones.', target: 5, category: 'constancia' },
  { id: 'ten-words', icon: '🧠', title: 'Memoria activa', description: 'Recuerda correctamente 10 palabras.', target: 10, category: 'memoria' },
  { id: 'twenty-five-words', icon: '💜', title: 'Mente en expansión', description: 'Recuerda correctamente 25 palabras.', target: 25, category: 'memoria' },
  { id: 'first-retention', icon: '🔭', title: 'Memoria comprobada', description: 'Completa tu primera medición de retención.', target: 1, category: 'memoria' },
  { id: 'three-retentions', icon: '🏆', title: 'Retentiva', description: 'Completa 3 mediciones de retención.', target: 3, category: 'memoria' },
  { id: 'three-strategies', icon: '🧪', title: 'Exploradora', description: 'Experimenta con las 3 estrategias de LÜ.', target: 3, category: 'exploracion' },
  { id: 'first-streak', icon: '🔥', title: 'Primer fuego', description: 'Consigue una racha de 3 días.', target: 3, category: 'constancia' },
  { id: 'seven-streak', icon: '🌟', title: 'Constancia', description: 'Consigue una racha de 7 días.', target: 7, category: 'constancia' },
];

export function getAchievementProgress(id: string, progress: any) {
  const map: Record<string, number> = {
    'first-session': progress.sessions,
    'three-sessions': progress.sessions,
    'five-sessions': progress.sessions,
    'ten-words': progress.wordsMastered,
    'twenty-five-words': progress.wordsMastered,
    'first-retention': progress.retentionCompleted,
    'three-retentions': progress.retentionCompleted,
    'three-strategies': progress.strategiesUsed,
    'first-streak': progress.streak,
    'seven-streak': progress.streak,
  };
  return map[id] ?? 0;
}
