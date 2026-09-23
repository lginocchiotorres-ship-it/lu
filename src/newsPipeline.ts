import {LiveHeadline} from './liveNews';
import {fetchSourceContent,NewsSourceContent} from './newsSource';
import {explainHeadline,NewsExplanation} from './newsExplanation';
import {createAIExplanationRequest,validateAIExplanation} from './aiNewsExplanation';

export type NewsPipelineResult={headline:LiveHeadline;sourceContent:NewsSourceContent|null;explanation:NewsExplanation;verifiedSource:boolean;aiGenerated:boolean;};
const API_BASE=(process.env.EXPO_PUBLIC_API_BASE_URL||'').replace(/\/$/,'');
async function requestAI(content:NewsSourceContent,headline:string):Promise<NewsExplanation|null>{
 if(!API_BASE)return null;
 const response=await fetch(`${API_BASE}/api/explain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(createAIExplanationRequest(content,headline))});
 if(!response.ok)return null;
 const data=await response.json();
 return validateAIExplanation(data?.explanation)?data.explanation:null;
}
function feedContent(n:LiveHeadline):NewsSourceContent{
 return{title:n.title,text:[n.title,n.description].filter(Boolean).join('\n\n'),source:n.source,url:n.url,published:n.published};
}
export async function buildNewsPipeline(headline:LiveHeadline):Promise<NewsPipelineResult>{
 const sourceContent=await fetchSourceContent(headline.url);
 if(!sourceContent){
  let explanation=explainHeadline(headline);
  let aiGenerated=false;
  try{const ai=await requestAI(feedContent(headline),headline.title);if(ai){explanation=ai;aiGenerated=true;}}catch{}
  return{headline,sourceContent:null,explanation,verifiedSource:false,aiGenerated};
 }
 const enriched:LiveHeadline={...headline,title:sourceContent.title||headline.title,description:sourceContent.text.slice(0,30000),source:sourceContent.source||headline.source};
 let explanation=explainHeadline(enriched),aiGenerated=false;
 try{const ai=await requestAI(sourceContent,enriched.title);if(ai){explanation=ai;aiGenerated=true;}}catch{}
 return{headline:enriched,sourceContent,explanation,verifiedSource:true,aiGenerated};
}
