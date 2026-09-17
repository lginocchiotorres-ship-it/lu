import type { VercelRequest,VercelResponse } from '@vercel/node';
import { aiExplanationPrompt,validateAIExplanation } from '../src/aiNewsExplanation';

function json(res:VercelResponse,status:number,body:unknown){return res.status(status).json(body);}

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
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

    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-4o-mini',
        temperature:0.1,
        response_format:{type:'json_object'},
        messages:[
          {role:'system',content:'Eres el editor de una aplicación de noticias. Prioriza precisión, neutralidad y claridad.'},
          {role:'user',content:prompt},
        ],
      }),
    });

    if(!response.ok){
      const detail=await response.text();
      console.error('AI provider error',response.status,detail.slice(0,500));
      return json(res,502,{error:'The AI provider could not generate the explanation.'});
    }

    const data=await response.json() as any;
    const raw=data?.choices?.[0]?.message?.content;
    if(typeof raw!=='string')return json(res,502,{error:'AI response was empty.'});

    let explanation:unknown;
    try{explanation=JSON.parse(raw);}catch{return json(res,502,{error:'AI response was not valid JSON.'});}
    if(!validateAIExplanation(explanation))return json(res,502,{error:'AI response did not match the expected news structure.'});

    return json(res,200,{explanation,model:data?.model||process.env.OPENAI_MODEL||'gpt-4o-mini',generatedAt:new Date().toISOString()});
  }catch(error){
    console.error('Explanation endpoint error',error);
    return json(res,500,{error:'Could not generate the explanation.'});
  }
}
