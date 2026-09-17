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
  'quePaso','quien','cuando','donde','porQue','comoPaso','datosClave',
  'contexto','consecuencia','aQuienAfecta','queSignifica','quePuedesHacer'
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
    'Eres el editor de Al Día. Explica la noticia con lenguaje claro, neutral y breve.',
    'Usa únicamente la información contenida en el texto proporcionado.',
    'No inventes nombres, fechas, causas, consecuencias, cifras ni lugares.',
    'Si un dato no está disponible, indícalo claramente.',
    'Devuelve únicamente JSON válido con estas claves: quePaso, quien, cuando, donde, porQue, comoPaso, datosClave, contexto, consecuencia, aQuienAfecta, queSignifica, quePuedesHacer.',
    'datosClave debe contener entre 2 y 4 elementos.',
    '',
    `TITULAR: ${request.headline}`,
    `FUENTE: ${request.source}`,
    `URL: ${request.url}`,
    `CONTENIDO: ${request.content}`,
  ].join('\n');
}
