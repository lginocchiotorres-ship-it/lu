import { Word } from './types';

type Pattern = { title: string; detail: string; kind: 'pattern' | 'false-friend' };

/** Learning cues for the prototype; they are not etymological claims. */
const PATTERNS: Record<string, Pattern> = {
  information: { title: 'Código descubierto: -ción → -tion', detail: 'información → information. Una terminación frecuente en español puede corresponder a -tion en inglés.', kind: 'pattern' },
  nation: { title: 'Código descubierto: -ción → -tion', detail: 'nación → nation. Compara la forma escrita y busca la regularidad.', kind: 'pattern' },
  communication: { title: 'Código descubierto: -ción → -tion', detail: 'comunicación → communication. Observa el cambio de terminación.', kind: 'pattern' },
  organization: { title: 'Código descubierto: -ción → -tion', detail: 'organización → organization. Úsalo como pista, no como regla absoluta.', kind: 'pattern' },
  education: { title: 'Código descubierto: -ción → -tion', detail: 'educación → education. La correspondencia puede facilitar el reconocimiento.', kind: 'pattern' },
  invitation: { title: 'Código descubierto: -ción → -tion', detail: 'invitación → invitation. Identifica la terminación antes de memorizar toda la palabra.', kind: 'pattern' },
  possible: { title: 'Código descubierto: -ible → -ible', detail: 'posible → possible. Las formas son muy parecidas entre idiomas.', kind: 'pattern' },
  responsible: { title: 'Código descubierto: -able → -ible', detail: 'responsable → responsible. Las formas son cercanas, pero no conviene asumir que todos los pares siguen esta transformación.', kind: 'pattern' },
  actual: { title: '⚠ Falso amigo', detail: '“Actual” en inglés significa “real” o “verdadero”; “actual” en español suele significar “current”.', kind: 'false-friend' },
  library: { title: '⚠ Falso amigo', detail: '“Library” significa “biblioteca”, no “librería”. La semejanza gráfica puede inducir a error.', kind: 'false-friend' },
  embarrassed: { title: '⚠ Falso amigo', detail: '“Embarrassed” significa “avergonzado/a”, no “embarazada”.', kind: 'false-friend' },
};

export function patternFor(word: Word): Pattern | null {
  return PATTERNS[word.word.toLowerCase()] ?? null;
}

export function allPatterns(): Pattern[] {
  return Object.values(PATTERNS);
}
