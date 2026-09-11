export type Strategy = 'context' | 'audio' | 'retrieval';

export type ExerciseType = 'context' | 'audio' | 'retrieval';

export type Word = {
  id: string;
  word: string;
  translation: string;
  example: string;
  context: string;
  difficulty: 1 | 2 | 3;
};

export type Answer = {
  wordId: string;
  strategy: Strategy;
  correct: boolean;
  responseMs: number;
  attempts: number;
  hints: number;
};

export type StrategyStats = {
  attempts: number;
  correct: number;
  totalResponseMs: number;
  totalHints: number;
  retention24Correct: number;
  retention24Total: number;
  retention7Correct: number;
  retention7Total: number;
};

export type Session = {
  id: string;
  createdAt: number;
  answers: Answer[];
};

export type RetentionRecord = {
  sessionId: string;
  dueAt: number;
  completedAt: number | null;
  horizon: 24 | 168;
  answers: Answer[];
};

export type GameResult = {
  gameId: string;
  strategy: string;
  correct: boolean;
  responseMs: number;
  round: number;
  production: boolean;
  /** True when the learner explicitly confirms the production was completed; not an AI quality score. */
  selfReported: boolean;
  helpUsed: boolean;
  createdAt: number;
};

export type LearningData = {
  sessions: Session[];
  retention: RetentionRecord[];
  gameResults?: GameResult[];
};
