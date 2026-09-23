export type LiveHeadline={topic:string;title:string;description:string;source:string;published:string;url:string};

const BASE_FEEDS:{topic:string;q:string}[]=[
 {topic:'PERÚ',q:'Perú when:1d'},
 {topic:'INTERNACIONAL',q:'world news when:1d'},
 {topic:'IA',q:'artificial intelligence when:1d'},
 {topic:'CURIOSIDADES',q:'science interesting facts when:1d'}
];

const SECTOR_FEEDS:{topic:string;q:string}[]=[
 {topic:'LOGÍSTICA',q:'logística cadena de suministro transporte puertos Perú when:1d'},
 {topic:'NEGOCIOS',q:'negocios empresas mercados comercio Perú when:1d'},
 {topic:'TECNOLOGÍA',q:'technology innovación digital Perú when:1d'},
 {topic:'CIENCIA',q:'ciencia investigación descubrimientos when:1d'},
 {topic:'ECONOMÍA',q:'economía inflación empleo mercados Perú when:1d'}
];

const API_BASE=(process.env.EXPO_PUBLIC_API_BASE_URL||'').replace(/\/$/,'');
const esc=(v:string)=>v.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const tag=(xml:string,name:string)=>{const m=xml.match(new RegExp('<'+name+'[^>]*>([\\s\\S]*?)</'+name+'>','i'));return m?esc(m[1].replace(/<!\\[CDATA\\[|\\]\\]>/g,'').trim()):''};
const clean=(v:string)=>v.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

async function directFeed(f:{topic:string;q:string}){
 const url='https://news.google.com/rss/search?q='+encodeURIComponent(f.q)+'&hl=es-419&gl=PE&ceid=PE:es-419';
 const r=await fetch(url); if(!r.ok)return [];
 const xml=await r.text(); const items:string[]=[]; let cursor=0;
 while(true){
  const start=xml.indexOf('<item>',cursor); if(start===-1)break;
  const end=xml.indexOf('</item>',start); if(end===-1)break;
  items.push(xml.slice(start,end+7)); cursor=end+7;
 }
 return items.slice(0,4).map(item=>({topic:f.topic,title:clean(tag(item,'title')),description:clean(tag(item,'description')),source:clean(tag(item,'source'))||'Google News',published:tag(item,'pubDate'),url:tag(item,'link')})).filter(x=>x.title);
}

export async function fetchLiveHeadlines(sector?:string):Promise<LiveHeadline[]>{
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[...BASE_FEEDS,selected]:[...BASE_FEEDS,...SECTOR_FEEDS];
 const endpointBase=typeof window!=='undefined'?'/api/headlines':(API_BASE?API_BASE+'/api/headlines':'');
 if(endpointBase){
  try{
   const endpoint=endpointBase+(sector?'?sector='+encodeURIComponent(sector):'');
   const response=await fetch(endpoint);
   if(response.ok){
    const data=await response.json();
    if(Array.isArray(data?.headlines)&&data.headlines.length)return data.headlines as LiveHeadline[];
   }
  }catch{}
 }
 const groups=await Promise.all(feeds.map(directFeed));
 return groups.flat();
}
