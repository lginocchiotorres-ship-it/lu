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

const esc=(v:string)=>v.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const tag=(xml:string,name:string)=>{const m=xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`,'i'));return m?esc(m[1].replace(/<!\[CDATA\[|\]\]>/g,'').trim()):''};
const clean=(v:string)=>v.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();

export async function fetchLiveHeadlines(sector?:string):Promise<LiveHeadline[]>{
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[...BASE_FEEDS,selected]:[...BASE_FEEDS,...SECTOR_FEEDS];
 const out:LiveHeadline[]=[];
 for(const f of feeds){
  try{
   const url=`https://news.google.com/rss/search?q=${encodeURIComponent(f.q)}&hl=es-419&gl=PE&ceid=PE:es-419`;
   const r=await fetch(url); if(!r.ok) continue;
   const xml=await r.text(); const items=xml.match(/<item>[\\s\\S]*?<\\/item>/gi)||[];
   for(const item of items.slice(0,4)){
    const title=clean(tag(item,'title')); const description=clean(tag(item,'description')); const source=clean(tag(item,'source'))||'Google News'; const published=tag(item,'pubDate'); const link=tag(item,'link');
    if(title) out.push({topic:f.topic,title,description,published,source,url:link});
   }
  }catch{}
 }
 return out;
}
