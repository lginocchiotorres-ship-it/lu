import {LiveHeadline} from './liveNews';

export type NewsExplanation={
  quePaso:string;
  quien:string;
  cuando:string;
  donde:string;
  porQue:string;
  comoPaso:string;
  datosClave:string[];
  contexto:string;
  consecuencia:string;
  aQuienAfecta:string;
  queSignifica:string;
  quePuedesHacer:string;
};

const clean=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();

/**
 * Builds a safe explanation from information actually present in the live feed.
 * It deliberately leaves unsupported fields explicit instead of inventing facts.
 * A future server-side source extractor/AI layer can replace this mapper without
 * changing the detail-screen contract.
 */
export function explainHeadline(n:LiveHeadline):NewsExplanation{
 const summary=clean(n.description);
 const source=n.source||'la fuente original';
 const when=n.published?new Date(n.published).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}):'Fecha no disponible';
 const where=n.topic==='PERÚ'?'Perú':'No indicado en el resumen disponible';
 return{
  quePaso:summary||'La noticia está disponible en la fuente original, pero el feed no entregó un resumen suficiente.',
  quien:'El resumen disponible no identifica de forma suficiente a todos los protagonistas.',
  cuando:when,
  donde:where,
  porQue:'El motivo o las causas requieren revisar el contenido completo de la fuente original.',
  comoPaso:'El resumen del feed no contiene suficientes detalles para reconstruir la secuencia de hechos sin riesgo de inventar información.',
  datosClave:[`Fuente: ${source}`,`Publicado: ${when}`,...(summary?[`Resumen: ${summary}`]:[])],
  contexto:'Esta explicación usa únicamente los datos recibidos desde el feed de noticias. Los detalles adicionales deben verificarse en la publicación original.',
  consecuencia:'El impacto o las consecuencias no pueden determinarse con precisión a partir del resumen disponible.',
  aQuienAfecta:'No está suficientemente especificado en el resumen disponible.',
  queSignifica:'El significado de la noticia depende de su desarrollo completo, los datos publicados y el contexto aportado por la fuente.',
  quePuedesHacer:'Abrir la fuente original para consultar el desarrollo completo y los datos que no aparecen en el resumen.'
 };
}

export function explanationForAudio(n:LiveHeadline){
 const e=explainHeadline(n);
 return `Al Día. ${n.title}. ${e.quePaso} ${e.queSignifica} Fuente: ${n.source}.`;
}
