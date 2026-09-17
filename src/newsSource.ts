export type NewsSourceContent={
  title:string;
  text:string;
  source:string;
  url:string;
  published:string;
};

const strip=(s:string)=>s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');

/**
 * Source adapter kept deliberately separate from the mobile UI.
 * In production this should be called by a server/proxy that is allowed to
 * retrieve the publisher page. The app must not contain publisher/API secrets.
 */
export async function fetchSourceContent(url:string):Promise<NewsSourceContent|null>{
  try{
    const response=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml'}});
    if(!response.ok)return null;
    const html=await response.text();
    const titleMatch=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const sourceMatch=url.match(/^https?:\/\/([^/]+)/i);
    const article=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
    const text=decode(strip(article)).slice(0,30000);
    if(!text)return null;
    return{title:decode(strip(titleMatch?.[1]||'')),text,source:sourceMatch?.[1]||'Fuente original',url,published:''};
  }catch{return null;}
}
