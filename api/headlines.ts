import type { VercelRequest,VercelResponse } from '@vercel/node';

type Feed={topic:string;q:string;domains?:string[]};

const BASE_FEEDS:Feed[]=[
 {topic:'PERÚ',q:'Perú gobierno economía sociedad seguridad infraestructura'},
 {topic:'INTERNACIONAL',q:'international breaking world news geopolitics economy'}
];

const SECTOR_FEEDS:Feed[]=[
 {topic:'INGENIERÍA',q:'ingeniería infraestructura megaproyectos automatización procesos CAD software modelado'},
 {topic:'LOGÍSTICA',q:'logística cadena suministro almacenes stock trazabilidad última milla puertos distribución'},
 {topic:'TRANSPORTE',q:'transporte fletes marítimos aéreos terrestres tráfico seguridad vial vehículos eléctricos movilidad urbana'},
 {topic:'SALUD',q:'salud pública hospitales epidemiología avances biomédicos regulación sanitaria'},
 {topic:'NUTRICIÓN',q:'nutrición alimentación valor nutricional inocuidad superalimentos etiquetado alimentos'},
 {topic:'AGROINDUSTRIAL',q:'agroindustria agroexportaciones cosecha fitosanitaria biomasa precios agrícolas'},
 {topic:'FINANCIERO Y BANCA',q:'banca tasas interés inflación divisas política monetaria créditos bolsa mercados financieros'},
 {topic:'ENERGÍA Y MINERÍA',q:'energía minería petróleo minerales transición energética hidroeléctrica solar gestión ambiental'},
 {topic:'TECNOLOGÍA E IA',q:'tecnología inteligencia artificial ciberseguridad software hardware economía digital'},
 {topic:'MANUFACTURA E INDUSTRIA',q:'manufactura industria producción calidad Lean Six Sigma seguridad industrial SST costos'},
 {topic:'COMERCIO EXTERIOR',q:'comercio exterior aranceles TLC aduanas acuerdos comerciales exportaciones importaciones'},
 {topic:'POLÍTICO Y GUBERNAMENTAL',q:'Perú política gobierno leyes reformas políticas públicas elecciones ministerios relaciones internacionales'},
 {topic:'BIOTECNOLOGÍA Y CIENCIAS',q:'biotecnología ciencia genómica fármacos bioprocesos investigación sostenibilidad'},
 {topic:'ENTRETENIMIENTO Y CULTURA',q:'cultura cine música espectáculos propiedad intelectual medios tendencias'},
 {topic:'DEPORTES',q:'deportes torneos ligas atletas fichajes eventos internacionales'}
];

const TRUSTED_DOMAINS=[
 'rpp.pe','elcomercio.pe','gestion.pe','andina.pe',
 'reuters.com','apnews.com','bbc.com','bbc.co.uk','dw.com','france24.com','aljazeera.com',
 'theguardian.com','npr.org','pbs.org',
 'gob.pe','bcrp.gob.pe','mef.gob.pe','minsa.gob.pe','minem.gob.pe','midagri.gob.pe',
 'mtc.gob.pe','indeci.gob.pe','senamhi.gob.pe','produce.gob.pe','sunat.gob.pe','inei.gob.pe',
 'who.int','paho.org','un.org','nasa.gov','nature.com','science.org'
];

const esc=(v:string)=>v.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const clean=(v:string)=>v.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const stripDomain=(url:string)=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''}};
const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

type Headline={topic:string;title:string;description:string;source:string;published:string;url:string;sourceVerified:boolean;corroborationCount:number;relevanceScore:number};

function clusterKey(title:string){
 const words=normalize(title).split(' ').filter(w=>w.length>3);
 return words.slice(0,8).join(' ');
}
function dedupeAndRank(items:Headline[],topic:string){
 const groups:Headline[][]=[];
 for(const item of items){
  const words=new Set(normalize(item.title).split(' ').filter(w=>w.length>3));
  let found=groups.find(g=>{
   const base=new Set(normalize(g[0].title).split(' ').filter(w=>w.length>3));
   const common=[...words].filter(w=>base.has(w)).length;
   return common>=4 || (common>=3 && common/Math.max(1,Math.min(words.size,base.size))>=.55);
  });
  if(found)found.push(item);else groups.push([item]);
 }
 return groups.map(g=>{
  const best=g.slice().sort((a,b)=>b.relevanceScore-a.relevanceScore)[0];
  const sources=[...new Set(g.map(x=>x.source))];
  return {...best,corroborationCount:sources.length,title:best.title};
 }).sort((a,b)=>b.relevanceScore-a.relevanceScore).slice(0,24);
}

function score(item:{title:string;description:string;published:string;sourceVerified:boolean},topic:string){
 const age=Math.max(0,(Date.now()-new Date(item.published).getTime())/3600000);
 const freshness=Number.isFinite(age)?Math.max(0,35-age*3):0;
 const verified=item.sourceVerified?35:0;
 const topicWords=new Set(normalize(topic).split(' ').filter(w=>w.length>3));
 const text=normalize(item.title+' '+item.description);
 const match=[...topicWords].filter(w=>text.includes(w)).length;
 return Math.round(freshness+verified+Math.min(20,match*5));
}

async function newsApiFeed(f:Feed,apiKey:string):Promise<Headline[]>{
 const params=new URLSearchParams({
  q:f.q,
  language:'es',
  from:new Date(Date.now()-36*3600000).toISOString(),
  sortBy:'publishedAt',
  pageSize:'30'
 });
 if(f.domains?.length)params.set('domains',f.domains.join(','));
 const r=await fetch('https://newsapi.org/v2/everything?'+params.toString(),{headers:{'X-Api-Key':apiKey}});
 if(!r.ok)throw new Error('NewsAPI '+r.status);
 const data=await r.json();
 if(data.status!=='ok')throw new Error(data.message||'NewsAPI error');
 return (data.articles||[]).map((a:any)=>({
  topic:f.topic,title:clean(a.title||''),description:clean(a.description||''),source:clean(a.source?.name||''),
  published:a.publishedAt||'',url:a.url||'',
  sourceVerified:TRUSTED_DOMAINS.some(d=>stripDomain(a.url||'')===d||stripDomain(a.url||'').endsWith('.'+d)),
  corroborationCount:1,relevanceScore:0
 })).filter((x:Headline)=>x.title&&x.url);
}

async function gdeltFeed(f:Feed):Promise<Headline[]>{
 const terms=f.q.split(' ').filter(Boolean).slice(0,8).map(x=>x.includes(' ')?'"'+x+'"':x).join(' OR ');
 const query=f.topic==='PERÚ'
  ? '('+terms+') sourcecountry:peru'
  : f.topic==='INTERNACIONAL' ? '('+terms+')' : '('+terms+')';
 const url='https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent(query)+'&mode=artlist&maxrecords=40&timespan=36h&sort=datedesc&format=json';
 const r=await fetch(url); if(!r.ok)throw new Error('GDELT '+r.status);
 const data=await r.json();
 const articles=data.articles||[];
 return articles.map((a:any)=>({
  topic:f.topic,title:clean(a.title||''),description:'',source:clean(a.domain||a.sourcecountry||''),
  published:a.seendate?String(a.seendate).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,'$1-$2-$3T$4:$5:$6Z'):'',
  url:a.url||'',sourceVerified:TRUSTED_DOMAINS.some(d=>stripDomain(a.url||'')===d||stripDomain(a.url||'').endsWith('.'+d)),
  corroborationCount:1,relevanceScore:0
 })).filter((x:Headline)=>x.title&&x.url);
}

export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const sector=typeof req.query.sector==='string'?req.query.sector:undefined;
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[selected,...BASE_FEEDS]:[...BASE_FEEDS,...SECTOR_FEEDS];
 const apiKey=process.env.NEWS_API_KEY;
 try{
  let groups:Headline[][];
  let provider='GDELT';
  if(apiKey){
   groups=await Promise.all(feeds.map(f=>newsApiFeed(f,apiKey)));
   provider='NewsAPI';
  }else{
   groups=await Promise.all(feeds.map(gdeltFeed));
  }
  const raw=groups.flat().map(x=>({...x,relevanceScore:score(x,x.topic)}));
  const headlines=dedupeAndRank(raw,sector||'PERÚ');
  return res.status(200).setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600').json({headlines,provider,sourcePolicy:'trusted-domain-allowlist + freshness + relevance + cross-source clustering'});
 }catch(error){
  console.error('Headlines endpoint error',error);
  return res.status(502).json({error:'Could not load curated live news.'});
 }
}
