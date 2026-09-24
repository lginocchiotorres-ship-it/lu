import {NewsExplanation} from './newsExplanation';
import {NewsSourceContent} from './newsSource';

export type AIExplanationRequest={
  headline:string;
  source:string;
  url:string;
  published:string;
  content:string;
};

export type AIExplanationResponse={
  explanation:NewsExplanation;
  model:string;
  generatedAt:string;
};

/**
 * Contract for the future server-side AI endpoint.
 *
 * The mobile application must never contain an AI provider secret. This helper
 * only describes the payload and validates the structured response received
 * from a secure backend.
 */
export function createAIExplanationRequest(content:NewsSourceContent,headline:string):AIExplanationRequest{
  return{
    headline,
    source:content.source,
    url:content.url,
    published:content.published,
    content:content.text.slice(0,30000),
  };
}

const fields:(keyof NewsExplanation)[]=[
  'unaFrase','loQuePaso10s','quePaso','quien','cuando','donde','porQue','comoPaso','datosClave',
  'contexto','consecuencia','aQuienAfecta','queSignifica','deberiaImportarte','loQueNoSabemos','quePuedesHacer'
];

export function validateAIExplanation(value:unknown):value is NewsExplanation{
  if(!value||typeof value!=='object')return false;
  const record=value as Record<string,unknown>;
  return fields.every(field=>{
    if(field==='datosClave')return Array.isArray(record[field])&&record[field].every(x=>typeof x==='string');
    return typeof record[field]==='string';
  });
}

export function aiExplanationPrompt(request:AIExplanationRequest):string{
 return [
  'Eres el editor de Al Día. Lee y resume la noticia de forma natural, clara y neutral.',
  'Usa todo el CONTENIDO disponible. Si es texto completo, analiza todo el artículo antes de resumir.',
  'Si solo hay titular y resumen, usa toda esa información y no inventes lo que falta.',
  'Nunca inventes nombres, fechas, causas, cifras, lugares o consecuencias.',
  'No le digas al usuario que consulte, revise o abra la fuente. Tu tarea es explicar la noticia.',
  'No repitas el titular como resumen. Cuenta qué ocurrió con frases naturales, como una persona explicándoselo a otra.',
  'Evita repetir la misma idea entre las distintas secciones.',
  'No incluyas URLs, dominios ni enlaces dentro de la explicación.',
  'EN UNA FRASE debe resumir el hecho en una sola frase, sin repetir literalmente el titular. LO QUE PASÓ EN 10 SEGUNDOS debe explicar el hecho con 1 o 2 frases concretas. Deben ser distintas pero coherentes.',
  'DATOS CLAVE debe contener entre 2 y 4 hechos concretos del contenido. DEBERÍA IMPORTARTE debe explicar de forma neutral por qué el hecho puede ser relevante para una persona interesada en el tema, sin exagerar. LO QUE NO SABEMOS debe mencionar únicamente vacíos de información que realmente existan en el contenido.',
  'Devuelve únicamente JSON válido con las claves solicitadas.',
  '',
  'TITULAR: '+request.headline,
  'FUENTE: '+request.source,
  'URL: '+request.url,
  'CONTENIDO: '+request.content,
 ].join('\\n');
}
