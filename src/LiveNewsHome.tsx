import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {SafeAreaView,ScrollView,Text,TouchableOpacity,View,StyleSheet,ActivityIndicator} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {fetchLiveHeadlines,LiveHeadline} from './liveNews';

const ORDER=['PERÚ','INTERNACIONAL','LOGÍSTICA','NEGOCIOS','TECNOLOGÍA','CIENCIA','ECONOMÍA','IA','CURIOSIDADES'];
const SECTORS=['LOGÍSTICA','NEGOCIOS','TECNOLOGÍA','CIENCIA','ECONOMÍA'];

const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const key=(s:string)=>clean(s.toLowerCase()).replace(/[^a-záéíóúñ0-9 ]/gi,'').split(' ').slice(0,12).join(' ');
const formatDate=(v:string)=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?v.replace(/\s\+\d{4}$/,''):d.toLocaleDateString('es-PE',{day:'2-digit',month:'short'});};
const strip=(s:string)=>clean(s.replace(/<[^>]*>/g,' '));

function prioritize(items:LiveHeadline[],sector:string){
 const seen=new Set<string>();
 const rank=(x:LiveHeadline)=>{if(x.topic==='PERÚ')return 0;if(x.topic==='INTERNACIONAL')return 1;if(x.topic===sector)return 2;if(x.topic==='IA')return 3;if(x.topic==='TECNOLOGÍA')return 4;if(x.topic==='CURIOSIDADES')return 5;return 6;};
 return [...items].filter(x=>{const k=key(x.title);if(!k||seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>rank(a)-rank(b));
}

export default function LiveNewsHome(){
 const [items,setItems]=useState<LiveHeadline[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState('');
 const [count,setCount]=useState(3);
 const [sector,setSector]=useState('LOGÍSTICA');
 const [selected,setSelected]=useState<LiveHeadline|null>(null);

 const load=useCallback(async()=>{setError('');setRefreshing(true);try{const data=await fetchLiveHeadlines();if(!data.length)throw new Error('No llegaron noticias');setItems(data);}catch(e){setError('No se pudieron actualizar las noticias. Revisa tu conexión e inténtalo de nuevo.');}finally{setLoading(false);setRefreshing(false);}},[]);
 useEffect(()=>{load();},[load]);
 const ordered=useMemo(()=>prioritize(items,sector).slice(0,count),[items,count,sector]);

 if(selected)return <SafeAreaView style={s.safe}><StatusBar style="dark"/><ScrollView contentContainerStyle={s.detail}>
  <TouchableOpacity onPress={()=>setSelected(null)}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
  <Text style={s.topic}>{selected.topic}</Text>
  <Text style={s.title}>{selected.title}</Text>
  <Text style={s.meta}>{selected.source}{selected.published?` · ${formatDate(selected.published)}`:''}</Text>
  <Section title="QUÉ PASÓ" text={strip(selected.description)||'La fuente presenta esta información en la publicación original.'}/>
  <Section title="CONTEXTO" text="Esta ficha parte de la información publicada por la fuente. Antes de interpretar detalles adicionales, conviene revisar la nota original."/>
  <Section title="QUÉ SIGNIFICA" text="Lee la noticia completa para conocer cifras, declaraciones y antecedentes que no aparecen en el titular o resumen del feed."/>
  <View style={s.sourceBox}><Text style={s.sourceLabel}>FUENTE ORIGINAL</Text><TouchableOpacity onPress={()=>Linking.openURL(selected.url)}><Text style={s.link}>Abrir noticia →</Text></TouchableOpacity></View>
  <Text style={s.note}>Al Día resume titulares y descripciones disponibles en fuentes externas. No agrega datos que no estén respaldados por ellas.</Text>
 </ScrollView></SafeAreaView>;

 return <SafeAreaView style={s.safe}><StatusBar style="dark"/><ScrollView contentContainerStyle={s.container}>
  <View style={s.header}><View><Text style={s.brand}>Al Día</Text><Text style={s.slogan}>Una noticia. Bien explicada. Y ya.</Text></View><TouchableOpacity style={s.refresh} onPress={load} disabled={refreshing}><Text style={s.refreshText}>{refreshing?'…':'↻'}</Text></TouchableOpacity></View>
  <Text style={s.eyebrow}>HOY</Text><Text style={s.heading}>Tu selección de noticias</Text>
  <Text style={s.sub}>Primero Perú, luego internacional y tu sector. Sin feed infinito.</Text>

  <View style={s.control}><Text style={s.controlTitle}>¿Cuántas noticias?</Text><View style={s.row}>{[1,2,3,4,5].map(n=><TouchableOpacity key={n} onPress={()=>setCount(n)} style={[s.pill,count===n&&s.pillOn]}><Text style={[s.pillText,count===n&&s.pillTextOn]}>{n}</Text></TouchableOpacity>)}</View></View>
  <Text style={s.controlTitle}>Tu sector</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontal}>{SECTORS.map(x=><TouchableOpacity key={x} onPress={()=>setSector(x)} style={[s.sector,sector===x&&s.sectorOn]}><Text style={[s.sectorText,sector===x&&s.sectorTextOn]}>{x}</Text></TouchableOpacity>)}</ScrollView>

  {loading?<View style={s.center}><ActivityIndicator/><Text style={s.loading}>Buscando noticias recientes…</Text></View>:error?<View style={s.error}><Text style={s.errorTitle}>No hay actualización</Text><Text style={s.errorText}>{error}</Text><TouchableOpacity style={s.retry} onPress={load}><Text style={s.retryText}>Actualizar noticias</Text></TouchableOpacity></View>:ordered.map((item,i)=><TouchableOpacity key={`${key(item.title)}-${i}`} style={s.card} onPress={()=>setSelected(item)} activeOpacity={.85}>
    <View style={s.cardTop}><Text style={s.topic}>{item.topic}</Text><Text style={s.number}>{String(i+1).padStart(2,'0')}</Text></View>
    <Text style={s.cardTitle}>{item.title}</Text>
    <Text style={s.cardDesc}>{strip(item.description)||'Lee el desarrollo completo en la fuente original.'}</Text>
    <View style={s.cardBottom}><Text style={s.meta}>{item.source}</Text><Text style={s.read}>Leer →</Text></View>
  </TouchableOpacity>)}
  {!loading&&!error&&ordered.length>0&&<View style={s.done}><Text style={s.doneTitle}>Eso es todo.</Text><Text style={s.doneText}>Ya estás al día. Vuelve cuando quieras.</Text></View>}
 </ScrollView></SafeAreaView>;
}

function Section({title,text}:{title:string;text:string}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionText}>{text}</Text></View>}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F5F0'},container:{padding:22,paddingBottom:48},detail:{padding:22,paddingBottom:48},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:28},brand:{fontSize:38,fontWeight:'800',color:'#171717',letterSpacing:-1.5},slogan:{fontSize:13,color:'#6D6A64',marginTop:2},refresh:{width:44,height:44,borderRadius:22,backgroundColor:'#171717',alignItems:'center',justifyContent:'center'},refreshText:{fontSize:25,color:'#FFF'},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:2,color:'#8B6F3D',marginBottom:5},heading:{fontSize:28,fontWeight:'800',color:'#171717',letterSpacing:-.6},sub:{fontSize:15,lineHeight:22,color:'#66625B',marginTop:7,marginBottom:20},control:{padding:16,backgroundColor:'#FFF',borderRadius:18,marginBottom:14},controlTitle:{fontSize:14,fontWeight:'800',color:'#272522',marginBottom:10},row:{flexDirection:'row',gap:8},pill:{width:42,height:38,borderRadius:19,backgroundColor:'#F0EEE9',alignItems:'center',justifyContent:'center'},pillOn:{backgroundColor:'#171717'},pillText:{fontWeight:'700',color:'#66625B'},pillTextOn:{color:'#FFF'},horizontal:{gap:8,paddingBottom:17},sector:{paddingHorizontal:14,paddingVertical:9,borderRadius:18,backgroundColor:'#EDEAE3'},sectorOn:{backgroundColor:'#D8C6A5'},sectorText:{fontSize:12,fontWeight:'700',color:'#5F5B53'},sectorTextOn:{color:'#28231A'},card:{backgroundColor:'#FFF',borderRadius:20,padding:19,marginBottom:14},cardTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:10},topic:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:'#8B6F3D'},number:{fontSize:11,fontWeight:'800',color:'#B4B0A7'},cardTitle:{fontSize:20,fontWeight:'800',lineHeight:25,color:'#181818',marginBottom:9},cardDesc:{fontSize:14,lineHeight:21,color:'#5F5B56'},cardBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:15,paddingTop:12,borderTopWidth:1,borderTopColor:'#EEEAE3'},meta:{fontSize:11,color:'#858078',flex:1},read:{fontSize:12,fontWeight:'800',color:'#171717'},center:{alignItems:'center',padding:45},loading:{marginTop:12,color:'#777'},error:{backgroundColor:'#FFF',padding:20,borderRadius:18,marginTop:10},errorTitle:{fontSize:18,fontWeight:'800',marginBottom:6},errorText:{fontSize:14,lineHeight:20,color:'#666'},retry:{marginTop:16,backgroundColor:'#171717',padding:13,borderRadius:14,alignItems:'center'},retryText:{color:'#FFF',fontWeight:'800'},done:{alignItems:'center',paddingVertical:24},doneTitle:{fontSize:20,fontWeight:'800'},doneText:{fontSize:13,color:'#777',marginTop:4},back:{fontSize:16,fontWeight:'800',marginBottom:25,color:'#171717'},title:{fontSize:29,lineHeight:35,fontWeight:'800',color:'#171717',marginTop:6},section:{marginTop:24},sectionTitle:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:'#8B6F3D',marginBottom:7},sectionText:{fontSize:16,lineHeight:24,color:'#35322E'},sourceBox:{marginTop:28,padding:18,borderRadius:18,backgroundColor:'#ECE8DF'},sourceLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:'#777'},link:{fontSize:15,fontWeight:'800',marginTop:8,color:'#171717'},note:{fontSize:11,lineHeight:16,color:'#8A867E',marginTop:18}}
