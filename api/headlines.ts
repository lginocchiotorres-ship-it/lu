import type { VercelRequest,VercelResponse } from '@vercel/node';

type Feed={topic:string;q:string};

const BASE_FEEDS:Feed[]=[
 {topic:'PERÚ',q:'Perú when:1d'},
 {topic:'INTERNACIONAL',q:'world news when:1d'},
 {topic:'IA',q:'artificial intelligence when:1d'},
 {topic:'CURIOSIDADES',q:'science interesting facts when:1d'}
];

const SECTOR_FEEDS:Feed[]=[
 {topic:'LOGÍSTICA',q:'logística cadena de suministro transporte puertos Perú when:1d'},
 {topic:'NEGOCIOS',q:'negocios empresas mercados comercio Perú when:1d'},
 {topic:'TECNOLOGÍA',q:'technology innovación digital Perú when:1d'},
 {topic:'CIENCIA',q:'ciencia investigación descubrimientos when:1d'},
 {topic:'ECONOMÍA',q:'economía inflación empleo mercados Perú when:1d'}
];

const esc=(v:string)=>v.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const tag=(xml:string,name:string)=>{const m=xml.match(new RegExp('<'+name+'[^>]*>([\\s\\S]*?)</'+name+'>','i'));return m?esc(m[1].replace(/<!\\[CDATA\\[|\\]\\]>/g,'').trim()):''};
const clean=(v:string)=>v.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();

async function feed(f:Feed){
 const url='https://news.google.com/rss/search?q='+encodeURIComponent(f.q)+'&hl=es-419&gl=PE&ceid=PE:es-419';
 const response=await fetch(url);
 if(!response.ok)return [];
 const xml=await response.text();
 const items:string[]=[];
 let cursor=0;
 while(true){
  const start=xml.indexOf('<item>',cursor);
  if(start===-1)break;
  const end=xml.indexOf('</item>',start);
  if(end===-1)break;
  items.push(xml.slice(start,end+7));
  cursor=end+7;
 }
 return items.slice(0,4).map(item=>({
  topic:f.topic,
  title:clean(tag(item,'title')),
  description:clean(tag(item,'description')),
  source:clean(tag(item,'source'))||'Google News',
  published:tag(item,'pubDate'),
  url:tag(item,'link')
 })).filter(x=>x.title);
}

export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const sector=typeof req.query.sector==='string'?req.query.sector:undefined;
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[...BASE_FEEDS,selected]:[...BASE_FEEDS,...SECTOR_FEEDS];
 try{
  const groups=await Promise.all(feeds.map(feed));
  const headlines=groups.flat();
  return res.status(200).setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600').json({headlines});
 }catch(error){
  console.error('Headlines endpoint error',error);
  return res.status(502).json({error:'Could not load live news.'});
 }
}
