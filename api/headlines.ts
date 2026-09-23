import type { VercelRequest,VercelResponse } from '@vercel/node';

type Feed={topic:string;q:string;domains?:string[]};

const BASE_FEEDS:Feed[]=[
 {topic:'PERÚ',q:'Perú gobierno economía sociedad seguridad infraestructura',domains:['rpp.pe','elcomercio.pe','gestion.pe','andina.pe','gob.pe']},
 {topic:'INTERNACIONAL',q:'international breaking world news geopolitics economy',domains:['reuters.com','apnews.com','bbc.com','bbc.co.uk','dw.com','france24.com','un.org']}
];

const VERIFIED_GENERAL=['rpp.pe','elcomercio.pe','gestion.pe','andina.pe','reuters.com','apnews.com','bbc.com','bbc.co.uk','dw.com','france24.com','theguardian.com','npr.org','pbs.org','aljazeera.com','gob.pe','bcrp.gob.pe','mef.gob.pe','minsa.gob.pe','minem.gob.pe','midagri.gob.pe','mtc.gob.pe','indeci.gob.pe','senamhi.gob.pe','produce.gob.pe','sunat.gob.pe','inei.gob.pe','who.int','paho.org','un.org','nasa.gov','nature.com','science.org'];

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

const SOURCE_TIERS:{domain:string;tier:number}[]=[
 ...['reuters.com','apnews.com','bbc.com','bbc.co.uk','dw.com','france24.com','who.int','paho.org','un.org','nasa.gov','nature.com','science.org'].map(domain=>({domain,tier:3})),
 ...['andina.pe','rpp.pe','elcomercio.pe','gestion.pe','gob.pe','bcrp.gob.pe','mef.gob.pe','minsa.gob.pe','minem.gob.pe','midagri.gob.pe','mtc.gob.pe','indeci.gob.pe','senamhi.gob.pe','produce.gob.pe','sunat.gob.pe','inei.gob.pe'].map(domain=>({domain,tier:3})),
 ...['theguardian.com','npr.org','pbs.org','aljazeera.com'].map(domain=>({domain,tier:2}))
];

const clean=(v:string)=>v.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const stripDomain=(url:string)=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''}};
const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const domainTier=(url:string)=>{const d=stripDomain(url);return SOURCE_TIERS.find(x=>d===x.domain||d.endsWith('.'+x.domain))?.tier||0};
const isTrusted=(url:string)=>domainTier(url)>0;

type Headline={topic:string;title:string;description:string;source:string;published:string;url:string;sourceVerified:boolean;corroborationCount:number;relevanceScore:number};

const TOPIC_TERMS:Record<string,string[]>={
 'PERÚ':['peru','perú','lima','ministerio','gobierno','congreso','bcrp','economia','seguridad'],
 'INTERNACIONAL':['international','world','global','geopolitics','united','europe','asia','china','usa'],
 'INGENIERÍA':['ingenieria','infraestructura','obra','construccion','automatizacion','robotica','cad','software'],
 'LOGÍSTICA':['logistica','suministro','almacen','stock','trazabilidad','puerto','distribucion','cadena'],
 'TRANSPORTE':['transporte','puerto','aereo','maritimo','terrestre','movilidad','trafico','vehiculo'],
 'SALUD':['salud','hospital','medicina','epidemia','vacuna','sanitario','paciente'],
 'NUTRICIÓN':['nutricion','alimento','alimentacion','inocuidad','superalimento','etiquetado'],
 'AGROINDUSTRIAL':['agro','agricola','agroexport','cosecha','cultivo','fitosanitario','campo'],
 'FINANCIERO Y BANCA':['banca','inflacion','tasa','credito','divisa','dolar','mercado','bolsa'],
 'ENERGÍA Y MINERÍA':['energia','mineria','petroleo','gas','mineral','solar','hidrica','litio'],
 'TECNOLOGÍA E IA':['tecnologia','inteligencia artificial','ia','software','hardware','ciberseguridad'],
 'MANUFACTURA E INDUSTRIA':['manufactura','industria','produccion','calidad','lean','six sigma','seguridad industrial'],
 'COMERCIO EXTERIOR':['comercio','exportacion','importacion','aduana','arancel','tlc','tratado'],
 'POLÍTICO Y GUBERNAMENTAL':['politica','gobierno','ley','reforma','eleccion','ministerio','congreso'],
 'BIOTECNOLOGÍA Y CIENCIAS':['biotecnologia','ciencia','genoma','genomica','investigacion','farmaco','bioproceso'],
 'ENTRETENIMIENTO Y CULTURA':['cultura','cine','musica','arte','espectaculo','television'],
 'DEPORTES':['deporte','futbol','liga','torneo','atleta','campeonato','olimpico']
};

const IMPACT_TERMS=['aprueba','aprobó','anuncia','anunció','entra en vigor','nueva ley','regulación','crisis','emergencia','alerta','acuerdo','inversión','millones','récord','descubre','descubrimiento','fallece','accidente','retiro','sanción','cambio','sube','baja','reforma'];

function relevance(item:Headline){
 const text=normalize(item.title+' '+item.description);
 const terms=TOPIC_TERMS[item.topic]||[];
 const topicHits=terms.filter(t=>text.includes(normalize(t))).length;
 const impactHits=IMPACT_TERMS.filter(t=>text.includes(normalize(t))).length;
 const ageHours=Math.max(0,(Date.now()-new Date(item.published).getTime())/3600000);
 const freshness=Number.isFinite(ageHours)?Math.max(0,30-ageHours*2.5):0;
 const source=domainTier(item.url);
 const trust=source?source*10:0;
 const specificity=Math.min(15,topicHits*3);
 const impact=Math.min(15,impactHits*3);
 return Math.round(freshness+trust+specificity+impact);
}

function dedupeAndRank(items:Headline[],allowUnverified=false){
 const groups:Headline[][]=[];
 for(const item of items){
  const words=new Set(normalize(item.title).split(' ').filter(w=>w.length>3));
  const found=groups.find(g=>{
   const base=new Set(normalize(g[0].title).split(' ').filter(w=>w.length>3));
   const common=[...words].filter(w=>base.has(w)).length;
   return common>=4 || (common>=3 && common/Math.max(1,Math.min(words.size,base.size))>=.55);
  });
  if(found)found.push(item);else groups.push([item]);
 }
 return groups.map(g=>{
  const sources=[...new Set(g.map(x=>x.source).filter(Boolean))];
  const best=g.slice().sort((a,b)=>b.relevanceScore-a.relevanceScore)[0];
  const corroborationBonus=Math.min(15,Math.max(0,sources.length-1)*5);
  return {...best,corroborationCount:sources.length,relevanceScore:best.relevanceScore+corroborationBonus};
 }).filter(x=>allowUnverified||x.sourceVerified||x.corroborationCount>=2)
   .sort((a,b)=>b.relevanceScore-a.relevanceScore).slice(0,24);
}

async function newsApiFeed(f:Feed,apiKey:string):Promise<Headline[]>{
 const params=new URLSearchParams({
  q:f.q,
  language:f.topic==='INTERNACIONAL'?'en':'es',
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
  published:a.publishedAt||'',url:a.url||'',sourceVerified:isTrusted(a.url||''),corroborationCount:1,relevanceScore:0
 })).filter((x:Headline)=>x.title&&x.url);
}

async function gdeltFeed(f:Feed):Promise<Headline[]>{
 const terms=f.q.split(' ').filter(Boolean).slice(0,8).map(x=>x.includes(' ')?'"'+x+'"':x).join(' OR ');
 const domainQuery=f.domains?.slice(0,5).map(d=>'domainis:'+d).join(' OR ');
 const query='('+terms+')'+(f.topic==='PERÚ'?' sourcecountry:peru':'')+(domainQuery?' ('+domainQuery+')':'');
 const url='https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent(query)+'&mode=artlist&maxrecords=40&timespan=72h&sort=datedesc&format=json';
 const r=await fetch(url,{headers:{Accept:'application/json'}});
 if(!r.ok)throw new Error('GDELT '+r.status);
 const data=await r.json();
 return (data.articles||[]).map((a:any)=>({
  topic:f.topic,title:clean(a.title||''),description:'',source:clean(a.domain||a.sourcecountry||''),
  published:a.seendate?String(a.seendate).replace(/(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})/,'$1-$2-$3T$4:$5:$6Z'):'',
  url:a.url||'',sourceVerified:isTrusted(a.url||''),corroborationCount:1,relevanceScore:0
 })).filter((x:Headline)=>x.title&&x.url);
}

async function googleNewsFeed(f:Feed):Promise<Headline[]>{
 const q=encodeURIComponent(f.q);
 const url='https://news.google.com/rss/search?q='+q+'&hl='+(f.topic==='INTERNACIONAL'?'en-US':'es-419')+'&gl=PE&ceid='+(f.topic==='INTERNACIONAL'?'US:en':'PE:es-419');
 const r=await fetch(url,{headers:{Accept:'application/rss+xml,application/xml,text/xml'}});
 if(!r.ok)throw new Error('Google News RSS '+r.status);
 const xml=await r.text();
 const blocks=xml.match(/<item>[\\s\\S]*?<\\/item>/gi)||[];
 return blocks.slice(0,30).map((block:any)=>{
  const read=(tag:string)=>{const m=block.match(new RegExp('<'+tag+'(?: [^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));return clean((m?.[1]||'').replace(/<!\\[CDATA\\[|\\]\\]>/g,''));};
  const source=read('source');
  const title=read('title');
  const link=read('link');
  const published=read('pubDate');
  return {topic:f.topic,title,description:'',source,published,url:link,sourceVerified:false,corroborationCount:1,relevanceScore:0};
 }).filter((x:Headline)=>x.title&&x.url);
}

export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const sector=typeof req.query.sector==='string'?req.query.sector:undefined;
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[selected,...BASE_FEEDS]:BASE_FEEDS;
 const apiKey=process.env.NEWS_API_KEY;
 try{
  const groups:Headline[][]=[];
  for(const f of feeds){
   let items:Headline[]=[];
   if(apiKey){
    try{items=await newsApiFeed({...f,domains:f.domains||VERIFIED_GENERAL},apiKey);}catch(error){console.warn('NewsAPI failed',f.topic,error);}
   }
   if(!items.length){
    try{items=await gdeltFeed(f);}catch(error){console.warn('GDELT failed',f.topic,error);}
   }
   if(items.length)groups.push(items);
  }
  const raw=groups.flat().map(x=>({...x,relevanceScore:relevance(x)}));
  let headlines=dedupeAndRank(raw);
  if(!headlines.length){
   const fallback:Headline[]=[];
   for(const f of (selected?[selected,...BASE_FEEDS]:BASE_FEEDS)){
    try{fallback.push(...await googleNewsFeed(f));}catch(error){console.warn('Google RSS failed',f.topic,error);}
   }
   headlines=dedupeAndRank(fallback.map(x=>({...x,relevanceScore:relevance(x)})),true);
  }
  return res.status(200).setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600')
   .json({headlines,provider:apiKey?'NewsAPI+GDELT+RSS':'GDELT+RSS',sourcePolicy:'freshness + source trust + sector match + impact signals + duplicate clustering'});
 }catch(error){
  console.error('Headlines endpoint error',error);
  return res.status(200).json({headlines:[],provider:'fallback',error:'No se pudo consultar una fuente de noticias en este momento.'});
 }
}
