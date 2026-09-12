export type MapNode = {
  id: string;
  name: string;
  zone: string;
  icon: string;
  description: string;
  unlocked: boolean;
  completed: boolean;
  position: 'left' | 'center' | 'right';
};

export type MapGroup = {
  id: number;
  title: string;
  subtitle: string;
  nodes: MapNode[];
  unlocked: boolean;
};

export const MAP_GROUPS: MapGroup[] = [
  {
    id: 1,
    title: 'Tu nueva vida',
    subtitle: 'Empieza a explorar tu nuevo mundo.',
    unlocked: true,
    nodes: [
      { id: 'hometown', name: 'Ciudad natal', zone: 'Tu llegada', icon: '🏡', description: 'Conoce tu nuevo hogar.', unlocked: true, completed: false, position: 'left' },
      { id: 'cafe', name: 'Cafetería', zone: 'Primer encuentro', icon: '☕', description: 'Conversa, escucha y descubre expresiones.', unlocked: true, completed: false, position: 'right' },
      { id: 'park', name: 'Parque', zone: 'Una tarde tranquila', icon: '🌳', description: 'Explora objetos y situaciones cotidianas.', unlocked: true, completed: false, position: 'center' },
    ],
  },
  {
    id: 2,
    title: 'Ya eres parte del lugar',
    subtitle: 'Ahora el mundo empieza a reconocerte.',
    unlocked: false,
    nodes: [
      { id: 'street', name: 'Calle principal', zone: 'Entre la gente', icon: '🏙️', description: 'Detecta expresiones que encajan con cada situación.', unlocked: false, completed: false, position: 'right' },
      { id: 'cinema', name: 'Cine', zone: 'Noche de película', icon: '🎬', description: 'Sigue el ritmo de las conversaciones.', unlocked: false, completed: false, position: 'left' },
      { id: 'library', name: 'Biblioteca', zone: 'Historias', icon: '📚', description: 'Reconstruye historias a partir del contexto.', unlocked: false, completed: false, position: 'center' },
    ],
  },
  {
    id: 3,
    title: 'Pon a prueba tu intuición',
    subtitle: 'El idioma ya empieza a sentirse familiar.',
    unlocked: false,
    nodes: [
      { id: 'station', name: 'Comisaría', zone: 'Caso cerrado', icon: '🔎', description: 'Escucha, encuentra inconsistencias y decide.', unlocked: false, completed: false, position: 'left' },
      { id: 'comedy', name: 'Club de comedia', zone: 'Entre risas', icon: '🎤', description: 'Descubre humor y dobles sentidos.', unlocked: false, completed: false, position: 'right' },
      { id: 'university', name: 'Universidad', zone: 'Nuevos retos', icon: '🎓', description: 'Pon tu producción en juego.', unlocked: false, completed: false, position: 'center' },
    ],
  },
  {
    id: 4,
    title: 'El mar te espera',
    subtitle: 'Un descanso también puede ser aprendizaje.',
    unlocked: false,
    nodes: [
      { id: 'beach', name: 'Playa', zone: 'Día de playa', icon: '🏖️', description: 'Aprende con situaciones espontáneas.', unlocked: false, completed: false, position: 'right' },
      { id: 'pier', name: 'Muelle', zone: 'Junto al agua', icon: '⚓', description: 'Interactúa con tu entorno.', unlocked: false, completed: false, position: 'left' },
      { id: 'restaurant', name: 'Restaurante', zone: 'A la mesa', icon: '🍽️', description: 'Usa el idioma en una situación real.', unlocked: false, completed: false, position: 'center' },
    ],
  },
];
