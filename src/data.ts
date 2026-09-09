import { Word } from './types';

export const WORDS: Word[] = [
  { id: 'window', word: 'window', translation: 'ventana', example: 'Open the window, please.', context: 'It is hot in the room, so Maria opens the window.', difficulty: 1 },
  { id: 'backpack', word: 'backpack', translation: 'mochila', example: 'My backpack is blue.', context: 'Before class, Daniel puts his notebook in his backpack.', difficulty: 1 },
  { id: 'bridge', word: 'bridge', translation: 'puente', example: 'We crossed the bridge.', context: 'The river is wide, so we cross it using the bridge.', difficulty: 1 },
  { id: 'garden', word: 'garden', translation: 'jardín', example: 'The garden is beautiful.', context: 'There are flowers and trees all around the garden.', difficulty: 1 },
  { id: 'journey', word: 'journey', translation: 'viaje', example: 'The journey was long.', context: 'The journey from the city to the mountains takes six hours.', difficulty: 2 },
  { id: 'improve', word: 'improve', translation: 'mejorar', example: 'I want to improve my English.', context: 'She practices every day because she wants to improve her English.', difficulty: 2 },
  { id: 'notice', word: 'notice', translation: 'notar', example: 'Did you notice the change?', context: 'He looks carefully and begins to notice small differences.', difficulty: 2 },
  { id: 'reliable', word: 'confiable', example: 'This source is reliable.', translation: 'confiable', context: 'We need information from a reliable source.', difficulty: 3 },
  { id: 'challenge', word: 'desafío', example: 'Learning a language is a challenge.', translation: 'desafío', context: 'Speaking with strangers can be a challenge at first.', difficulty: 2 },
  { id: 'achieve', word: 'lograr', example: 'She wants to achieve her goal.', translation: 'lograr', context: 'With consistent practice, she can achieve her goal.', difficulty: 3 },
];

export const STRATEGIES = [
  { key: 'context' as const, title: 'Contexto', subtitle: 'Relaciona la palabra con una situación real.', icon: '◌' },
  { key: 'audio' as const, title: 'Audio', subtitle: 'Escucha, reconoce y recupera el sonido.', icon: '◉' },
  { key: 'retrieval' as const, title: 'Recuperación', subtitle: 'Recuerda la palabra con menos pistas.', icon: '✦' },
];
