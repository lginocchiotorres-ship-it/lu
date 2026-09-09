import { Word } from './types';

export const WORDS: Word[] = [
  { id: 'window', word: 'window', translation: 'ventana', example: 'Open the window, please.', context: 'It is hot in the room, so Maria opens the window.', difficulty: 1 },
  { id: 'information', word: 'information', translation: 'información', example: 'I need more information.', context: 'Before making a decision, she looks for more information.', difficulty: 2 },
  { id: 'nation', word: 'nation', translation: 'nación', example: 'Every nation has its own history.', context: 'The museum tells the story of the nation.', difficulty: 2 },
  { id: 'actual', word: 'actual', translation: 'real', example: 'The actual cost was higher.', context: 'The actual cost was different from the estimated cost.', difficulty: 3 },
  { id: 'journey', word: 'journey', translation: 'viaje', example: 'The journey was long.', context: 'The journey from the city to the mountains takes six hours.', difficulty: 2 },
  { id: 'backpack', word: 'backpack', translation: 'mochila', example: 'My backpack is blue.', context: 'Before class, Daniel puts his notebook in his backpack.', difficulty: 1 },
  { id: 'bridge', word: 'bridge', translation: 'puente', example: 'We crossed the bridge.', context: 'The river is wide, so we cross it using the bridge.', difficulty: 1 },
  { id: 'garden', word: 'garden', translation: 'jardín', example: 'The garden is beautiful.', context: 'There are flowers and trees all around the garden.', difficulty: 1 },
  { id: 'improve', word: 'improve', translation: 'mejorar', example: 'I want to improve my English.', context: 'She practices every day because she wants to improve her English.', difficulty: 2 },
  { id: 'achieve', word: 'achieve', translation: 'lograr', example: 'She wants to achieve her goal.', context: 'With consistent practice, she can achieve her goal.', difficulty: 3 },
];

export const STRATEGIES = [
  { key: 'context' as const, title: 'Contexto', subtitle: 'Relaciona la palabra con una situación real.', icon: '◌' },
  { key: 'audio' as const, title: 'Audio', subtitle: 'Escucha, reconoce y recupera el sonido.', icon: '◉' },
  { key: 'retrieval' as const, title: 'Recuperación', subtitle: 'Recuerda la palabra con menos pistas.', icon: '✦' },
];
