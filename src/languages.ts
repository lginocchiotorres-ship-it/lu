import { LanguagePair, Word } from './types';

export const LANGUAGE_PAIRS: LanguagePair[] = [
  { id: 'es-en', source: 'es', target: 'en', sourceLabel: 'Español', targetLabel: 'English', speechLocale: 'en-US' },
  { id: 'es-it', source: 'es', target: 'it', sourceLabel: 'Español', targetLabel: 'Italiano', speechLocale: 'it-IT' },
  { id: 'es-fr', source: 'es', target: 'fr', sourceLabel: 'Español', targetLabel: 'Français', speechLocale: 'fr-FR' },
  { id: 'es-de', source: 'es', target: 'de', sourceLabel: 'Español', targetLabel: 'Deutsch', speechLocale: 'de-DE' },
];

export const DEFAULT_LANGUAGE_PAIR_ID = 'es-en';

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

export const FRENCH_WORDS: Word[] = [
  { id: 'fr-fenetre', word: 'fenêtre', translation: 'ventana', example: 'Ouvre la fenêtre, s’il te plaît.', context: 'Il fait chaud dans la pièce, alors Maria ouvre la fenêtre.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-information', word: 'information', translation: 'información', example: 'J’ai besoin de plus d’informations.', context: 'Avant de décider, elle cherche plus d’informations.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-nation', word: 'nation', translation: 'nación', example: 'Chaque nation a sa propre histoire.', context: 'Le musée raconte l’histoire de la nation.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-voyage', word: 'voyage', translation: 'viaje', example: 'Le voyage était long.', context: 'Le voyage de la ville aux montagnes dure six heures.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-sac', word: 'sac à dos', translation: 'mochila', example: 'Mon sac à dos est bleu.', context: 'Avant le cours, Daniel met son cahier dans son sac à dos.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-pont', word: 'pont', translation: 'puente', example: 'Nous avons traversé le pont.', context: 'La rivière est large, alors nous la traversons par le pont.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-jardin', word: 'jardin', translation: 'jardín', example: 'Le jardin est magnifique.', context: 'Il y a des fleurs et des arbres partout dans le jardin.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-ameliorer', word: 'améliorer', translation: 'mejorar', example: 'Je veux améliorer mon français.', context: 'Elle pratique chaque jour parce qu’elle veut améliorer son français.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-atteindre', word: 'atteindre', translation: 'lograr / alcanzar', example: 'Elle veut atteindre son objectif.', context: 'Avec une pratique régulière, elle peut atteindre son objectif.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'fr' },
  { id: 'fr-reel', word: 'réel', translation: 'real', example: 'Le coût réel était plus élevé.', context: 'Le coût réel était différent du coût estimé.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'fr' },
];

export const GERMAN_WORDS: Word[] = [
  { id: 'de-fenster', word: 'Fenster', translation: 'ventana', example: 'Öffne bitte das Fenster.', context: 'Es ist heiß im Zimmer, deshalb öffnet Maria das Fenster.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-information', word: 'Information', translation: 'información', example: 'Ich brauche mehr Informationen.', context: 'Vor der Entscheidung sucht sie nach mehr Informationen.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-nation', word: 'Nation', translation: 'nación', example: 'Jede Nation hat ihre eigene Geschichte.', context: 'Das Museum erzählt die Geschichte der Nation.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-reise', word: 'Reise', translation: 'viaje', example: 'Die Reise war lang.', context: 'Die Reise von der Stadt in die Berge dauert sechs Stunden.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-rucksack', word: 'Rucksack', translation: 'mochila', example: 'Mein Rucksack ist blau.', context: 'Vor dem Unterricht legt Daniel sein Heft in den Rucksack.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-bruecke', word: 'Brücke', translation: 'puente', example: 'Wir überquerten die Brücke.', context: 'Der Fluss ist breit, deshalb überqueren wir ihn über die Brücke.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-garten', word: 'Garten', translation: 'jardín', example: 'Der Garten ist wunderschön.', context: 'Im ganzen Garten gibt es Blumen und Bäume.', difficulty: 1, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-verbessern', word: 'verbessern', translation: 'mejorar', example: 'Ich möchte mein Deutsch verbessern.', context: 'Sie übt jeden Tag, weil sie ihr Deutsch verbessern möchte.', difficulty: 2, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-erreichen', word: 'erreichen', translation: 'lograr / alcanzar', example: 'Sie möchte ihr Ziel erreichen.', context: 'Mit regelmäßigem Üben kann sie ihr Ziel erreichen.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'de' },
  { id: 'de-real', word: 'real', translation: 'real', example: 'Die realen Kosten waren höher.', context: 'Die realen Kosten waren anders als die geschätzten Kosten.', difficulty: 3, sourceLanguage: 'es', targetLanguage: 'de' },
];

export function getLanguagePair(id?: string) {
  return LANGUAGE_PAIRS.find(pair => pair.id === id) ?? LANGUAGE_PAIRS[0];
}

export function getWordsForPair(pairId: string, englishWords: Word[]): Word[] {
  if (pairId === 'es-it') return ITALIAN_WORDS;
  if (pairId === 'es-fr') return FRENCH_WORDS;
  if (pairId === 'es-de') return GERMAN_WORDS;
  return englishWords.map(word => ({ ...word, sourceLanguage: 'es', targetLanguage: 'en' }));
}
