export type LiveHeadline={topic:string;title:string;description:string;source:string;published:string;url:string;sourceVerified?:boolean;corroborationCount?:number;relevanceScore?:number};

const SECTOR_FEEDS:{topic:string;q:string}[]=[
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

const API_BASE=(process.env.EXPO_PUBLIC_API_BASE_URL||'').replace(/\/$/,'');
const directFallback=async(sector?:string):Promise<LiveHeadline[]>=>{
 const endpoint=typeof window!=='undefined'?'/api/headlines':(API_BASE?API_BASE+'/api/headlines':'');
 if(!endpoint)return [];
 const url=endpoint+(sector?'?sector='+encodeURIComponent(sector):'');
 try{const r=await fetch(url);if(!r.ok)return [];const d=await r.json();return Array.isArray(d?.headlines)?d.headlines:[]}catch{return []}
};

export async function fetchLiveHeadlines(sector?:string):Promise<LiveHeadline[]>{
 return directFallback(sector);
}
