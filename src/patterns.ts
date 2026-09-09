import { Word } from './types';

type Pattern = { title: string; detail: string; kind: 'pattern' | 'false-friend' };

const PATTERNS: Record<string, Pattern> = {
  information: { title: 'Código descubierto: -ción → -tion', detail: 'información → information. Este patrón puede ayudarte a reconocer palabras relacionadas entre español e inglés.', kind: 'pattern' },
  nation: { title: 'Código descubierto: -ción → -tion', detail: 'nación → nation. Observa la transformación del sufijo al pasar al inglés.', kind: 'pattern' },
  communication: { title: 'Código descubierto: -ción → -tion', detail: 'comunicación → communication. La estructura se mantiene con un cambio regular.', kind: 'pattern' },
  actual: { title: '⚠ Falso amigo', detail: '“Actual” en inglés significa “real” o “verdadero”; “actual” en español suele significar “current”.', kind: 'false-friend' },
};

export function patternFor(word: Word): Pattern | null { return PATTERNS[word.word.toLowerCase()] ?? null; }
