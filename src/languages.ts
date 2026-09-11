import { LanguagePair, Word } from './types';

export const LANGUAGE_PAIRS: LanguagePair[] = [
  { id: 'es-en', source: 'es', target: 'en', sourceLabel: 'Español', targetLabel: 'English', speechLocale: 'en-US' },
  { id: 'es-it', source: 'es', target: 'it', sourceLabel: 'Español', targetLabel: 'Italiano', speechLocale: 'it-IT' },
  { id: 'es-fr', source: 'es', target: 'fr', sourceLabel: 'Español', targetLabel: 'Français', speechLocale: 'fr-FR' },
  { id: 'es-de', source: 'es', target: 'de', sourceLabel: 'Español', targetLabel: 'Deutsch', speechLocale: 'de-DE' },
];

export const DEFAULT_LANGUAGE_PAIR_ID = 'es-en';

/**
 * Starter content for the second language. Kept separate from the MVP English
 * bank so that LÜ can grow without mixing words from different languages.
 */
export const ITALIAN_WORDS: Word[] = [
  { id: 'it-finestra', word: 'finestra', translation: 'ventana', example: 'Apri la finestra, per favore.', context: 'Fa caldo nella stanza, così Maria apre la finestra.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-informazione', word: 'informazione', translation: 'información', example: 'Ho bisogno di più informazioni.', context: 'Prima di decidere, cerca più informazioni.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-nazione', word: 'nazione', translation: 'nación', example: 'Ogni nazione ha la propria storia.', context: 'Il museo racconta la storia della nazione.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-viaggio', word: 'viaggio', translation: 'viaje', example: 'Il viaggio è stato lungo.', context: 'Il viaggio dalla città alle montagne dura sei ore.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-zaino', word: 'zaino', translation: 'mochila', example: 'Il mio zaino è blu.', context: 'Prima della lezione, Daniel mette il quaderno nello zaino.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-ponte', word: 'ponte', translation: 'puente', example: 'Abbiamo attraversato il ponte.', context: 'Il fiume è largo, quindi lo attraversiamo sul ponte.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-giardino', word: 'giardino', translation: 'jardín', example: 'Il giardino è bellissimo.', context: 'Ci sono fiori e alberi in tutto il giardino.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-migliorare', word: 'migliorare', translation: 'mejorar', example: 'Voglio migliorare il mio italiano.', context: 'Si esercita ogni giorno perché vuole migliorare il suo italiano.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-raggiungere', word: 'raggiungere', translation: 'lograr / alcanzar', example: 'Vuole raggiungere il suo obiettivo.', context: 'Con una pratica costante può raggiungere il suo obiettivo.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'it' },
  { id: 'it-reale', word: 'reale', translation: 'real', example: 'Il costo reale era più alto.', context: 'Il costo reale era diverso da quello stimato.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'it' },
];

export function getLanguagePair(id?: string) {
  return LANGUAGE_PAIRS.find(pair => pair.id === id) ?? LANGUAGE_PAIRS[0];
}

export function getWordsForPair(pairId: string, englishWords: Word[]): Word[] {
  if (pairId === 'es-it') return ITALIAN_WORDS;
  return englishWords.map(word => ({ ...word, sourceLanguage: 'es', targetLanguage: 'en' }));
}
