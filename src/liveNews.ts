export type LiveHeadline={topic:string;title:string;description:string;source:string;published:string;url:string};

const BASE_FEEDS:{topic:string;q:string}[]=[
 {topic:'PERÚ',q:'Perú noticias when:1d'},
 {topic:'INTERNACIONAL',q:'world news when:1d'}
];

const SECTOR_FEEDS:{topic:string;q:string}[]=[
 {topic:'INGENIERÍA',q:'ingeniería infraestructura megaproyectos automatización procesos CAD software modelado when:1d'},
 {topic:'LOGÍSTICA',q:'logística cadena suministro almacenes stock trazabilidad última milla puertos distribución when:1d'},
 {topic:'TRANSPORTE',q:'transporte fletes marítimos aéreos terrestres tráfico seguridad vial vehículos eléctricos movilidad urbana when:1d'},
 {topic:'SALUD',q:'salud pública hospitales epidemiología avances biomédicos regulación sanitaria when:1d'},
 {topic:'NUTRICIÓN',q:'nutrición alimentación valor nutricional inocuidad superalimentos etiquetado alimentos when:1d'},
 {topic:'AGROINDUSTRIAL',q:'agroindustria agroexportaciones cosecha fitosanitaria biomasa precios agrícolas when:1d'},
 {topic:'FINANCIERO Y BANCA',q:'banca tasas interés inflación divisas política monetaria créditos bolsa mercados financieros when:1d'},
 {topic:'ENERGÍA Y MINERÍA',q:'energía minería petróleo minerales transición energética hidroeléctrica solar gestión ambiental when:1d'},
 {topic:'TECNOLOGÍA E IA',q:'tecnología inteligencia artificial ciberseguridad software hardware economía digital when:1d'},
 {topic:'MANUFACTURA E INDUSTRIA',q:'manufactura industria producción calidad Lean Six Sigma seguridad industrial SST costos when:1d'},
 {topic:'COMERCIO EXTERIOR',q:'comercio exterior aranceles TLC aduanas acuerdos comerciales exportaciones importaciones when:1d'},
 {topic:'POLÍTICO Y GUBERNAMENTAL',q:'Perú política gobierno leyes reformas políticas públicas elecciones ministerios relaciones internacionales when:1d'},
 {topic:'BIOTECNOLOGÍA Y CIENCIAS',q:'biotecnología ciencia genómica fármacos bioprocesos investigación sostenibilidad when:1d'},
 {topic:'ENTRETENIMIENTO Y CULTURA',q:'cultura cine música espectáculos propiedad intelectual medios tendencias when:1d'},
 {topic:'DEPORTES',q:'deportes torneos ligas atletas fichajes eventos internacionales when:1d'}
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
 return items.slice(0,8).map(item=>({topic:f.topic,title:clean(tag(item,'title')),description:clean(tag(item,'description')),source:clean(tag(item,'source'))||'Google News',published:tag(item,'pubDate'),url:tag(item,'link')})).filter(x=>x.title);
}

export async function fetchLiveHeadlines(sector?:string):Promise<LiveHeadline[]>{
 const selected=SECTOR_FEEDS.find(f=>f.topic===sector);
 const feeds=selected?[selected,...BASE_FEEDS]:[...BASE_FEEDS,...SECTOR_FEEDS];
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
