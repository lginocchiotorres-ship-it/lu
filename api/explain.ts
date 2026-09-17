import type { VercelRequest,VercelResponse } from '@vercel/node';
import { aiExplanationPrompt,validateAIExplanation } from '../src/aiNewsExplanation';

function json(res:VercelResponse,status:number,body:unknown){return res.status(status).json(body);}

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  const key=process.env.GEMINI_API_KEY;
  if(!key)return json(res,503,{error:'AI service is not configured yet.'});

  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body||typeof body!=='object')return json(res,400,{error:'Invalid request.'});
    const {headline,source,url,published,content}=body as Record<string,unknown>;
    if([headline,source,url,published,content].some(x=>typeof x!=='string'||!x.trim()))return json(res,400,{error:'headline, source, url, published and content are required.'});

    const prompt=aiExplanationPrompt({
      headline:headline as string,
      source:source as string,
      url:url as string,
      published:published as string,
      content:content as string,
    });

    const model=process.env.GEMINI_MODEL||'gemini-2.5-flash-lite';
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:'Eres el editor de una aplicación de noticias. Prioriza precisión, neutralidad y claridad. Usa únicamente la información proporcionada y no inventes datos.'}]},
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{temperature:0.1,responseMimeType:'application/json'},
      }),
    });

    if(!response.ok){
      const detail=await response.text();
      console.error('Gemini provider error',response.status,detail.slice(0,500));
      return json(res,502,{error:'The AI provider could not generate the explanation.'});
    }

    const data=await response.json() as any;
    const raw=data?.candidates?.[0]?.content?.parts?.map((part:any)=>part?.text||'').join('');
    if(typeof raw!=='string'||!raw.trim())return json(res,502,{error:'AI response was empty.'});

    let explanation:unknown;
    try{explanation=JSON.parse(raw);}catch{return json(res,502,{error:'AI response was not valid JSON.'});}
    if(!validateAIExplanation(explanation))return json(res,502,{error:'AI response did not match the expected news structure.'});

    return json(res,200,{explanation,model:data?.modelVersion||model,generatedAt:new Date().toISOString()});
  }catch(error){
    console.error('Explanation endpoint error',error);
    return json(res,500,{error:'Could not generate the explanation.'});
  }
}
