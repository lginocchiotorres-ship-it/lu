import {LiveHeadline} from './liveNews';

export type NewsExplanation={unaFrase:string;loQuePaso10s:string;quePaso:string;quien:string;cuando:string;donde:string;porQue:string;comoPaso:string;datosClave:string[];contexto:string;consecuencia:string;aQuienAfecta:string;queSignifica:string;deberiaImportarte:string;loQueNoSabemos:string;quePuedesHacer:string;};

const clean=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/g,'&').replace(/https?:\/\/\S+/gi,' ').replace(/\s+/g,' ').trim();
const sentence=(s:string)=>s.replace(/[🔴🔵🟢🟡🟠🟣⚫⚪🔺🔻⬇⬆➡⬅]/g,' ').replace(/\s+/g,' ').trim();

function extractMatchInfo(title:string){
 const t=sentence(clean(title));
 const teams=t.match(/(Perú|Argentina|Brasil|Chile|Colombia|Ecuador|Bolivia|Uruguay|Paraguay|Venezuela|México|España|Francia|Italia|Alemania)\s+vs\.?\s+(Perú|Argentina|Brasil|Chile|Colombia|Ecuador|Bolivia|Uruguay|Paraguay|Venezuela|México|España|Francia|Italia|Alemania)/i);
 const stage=t.match(/(semifinal(?:es)?|final|cuartos de final|octavos de final)/i)?.[1];
 const event=t.match(/(Juegos Suramericanos[^,.:!?]*)/i)?.[1];
 return{t,teams:teams?.[0],stage,event};
}

export function explainHeadline(n:LiveHeadline):NewsExplanation{
 const info=extractMatchInfo(n.title);
 const summary=sentence(clean(n.description));
 const when=n.published?new Date(n.published).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}):'Fecha no disponible';
 const where=n.topic==='PERÚ'?'Perú':'No indicado en la información disponible';
 if(info.teams){
  const parts=info.teams.split(/\s+vs\.?\s+/i);
  const stageText=info.stage?' por '+info.stage:'';
  const eventText=info.event?' en '+info.event:'';
  return{
   unaFrase:info.teams+' se enfrentan'+stageText+eventText+'.',
   loQuePaso10s:info.teams+' se enfrentan'+stageText+eventText+'. La publicación informa sobre el partido y ofrece información para seguirlo en vivo.',
   quePaso:info.teams+' se enfrentan'+stageText+eventText+'. La publicación informa sobre el partido y ofrece información para seguirlo en vivo.',
   quien:'Las selecciones de '+parts[0]+' y '+parts[1]+' son las protagonistas del partido.',
   cuando:when,
   donde:where,
   porQue:'El partido corresponde a '+(info.stage||'una instancia de competencia')+(info.event?' de '+info.event:'')+'.',
   comoPaso:'La noticia presenta el encuentro como un partido entre '+info.teams+(info.stage?' por '+info.stage:'')+' y señala que existe información para seguir la transmisión.',
   datosClave:['Partido: '+info.teams,...(info.stage?['Instancia: '+info.stage]:[]),...(info.event?['Competencia: '+info.event]:[])],
   contexto:'El encuentro forma parte de la competencia indicada en la publicación. La nota está enfocada en la hora y las opciones para seguir el partido.',
   consecuencia:'El resultado del partido determinará el avance de los equipos en esta instancia de la competencia.',
   aQuienAfecta:'Principalmente a las selecciones participantes y a quienes siguen la competencia.',
   queSignifica:'Es un partido de '+(info.stage||'competencia')+' entre '+info.teams+', dentro de '+(info.event||'la competición mencionada en la noticia')+'.',
   deberiaImportarte:'Puede interesarte si sigues a alguno de los equipos o esta competencia.',
   loQueNoSabemos:'La información disponible no permite conocer otros detalles del encuentro.',
   quePuedesHacer:'Si quieres seguir el encuentro, revisa la hora y el medio de transmisión indicados en la publicación.'
  };
 }
 const useful=summary||sentence(clean(n.title));
 return{
  unaFrase:useful||'La noticia informa sobre un hecho reciente.',
  loQuePaso10s:useful||'La noticia informa sobre un hecho reciente.',
  quePaso:useful||'La noticia informa sobre un hecho reciente.',
  quien:'Los protagonistas no están claramente identificados en la información disponible.',
  cuando:when,donde:where,
  porQue:'La causa o el motivo no aparecen de forma suficiente en la información disponible.',
  comoPaso:'La información recibida resume el hecho, pero no explica toda la secuencia de acontecimientos.',
  datosClave:[...(n.title?['Tema: '+sentence(clean(n.title))]:[]),...(summary&&summary!==n.title?['Resumen: '+summary]:[]), 'Publicado: '+when],
  contexto:'La noticia corresponde al tema y fecha indicados en el feed.',
  consecuencia:'Las consecuencias específicas no están indicadas en la información disponible.',
  aQuienAfecta:'No se puede determinar con precisión a partir de la información disponible.',
  queSignifica:'La noticia informa sobre '+sentence(clean(n.title)).replace(/[.:]+$/,'')+'.',
  deberiaImportarte:'Su relevancia para ti depende de tu interés en el tema y de las personas o sectores involucrados.',
  loQueNoSabemos:'La información disponible no permite determinar más detalles con precisión.',
  quePuedesHacer:'Si necesitas confirmar un detalle específico, consulta la publicación enlazada.'
 };
}

export function explanationForAudio(n:LiveHeadline){const e=explainHeadline(n);return 'Al Día. '+sentence(n.title)+'. '+e.quePaso+' '+e.queSignifica;}