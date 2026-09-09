export type GameId = 'rapid' | 'memory' | 'sentence' | 'pattern';
export type Game = { id: GameId; icon: string; title: string; subtitle: string; color: string; description: string };
export const GAMES: Game[] = [
 { id:'rapid', icon:'⚡', title:'Reto relámpago', subtitle:'Responde antes de que se acabe el tiempo', color:'#6D28D9', description:'Recuperación activa a contrarreloj.' },
 { id:'memory', icon:'🧩', title:'Parejas', subtitle:'Une cada palabra con su significado', color:'#8B5CF6', description:'Practica asociación y recuperación.' },
 { id:'sentence', icon:'💬', title:'Arma la frase', subtitle:'Ordena las palabras y crea una oración', color:'#7C3AED', description:'Producción y reconocimiento gramatical.' },
 { id:'pattern', icon:'🔐', title:'Código lingüístico', subtitle:'Descubre patrones entre idiomas', color:'#5B21B6', description:'Encuentra cognados, sufijos y falsos amigos.' },
];
