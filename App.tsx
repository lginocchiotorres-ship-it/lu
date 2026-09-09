import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORDS = [
  { word: 'window', translation: 'ventana', example: 'Open the window, please.' },
  { word: 'backpack', translation: 'mochila', example: 'My backpack is blue.' },
  { word: 'bridge', translation: 'puente', example: 'We crossed the bridge.' },
  { word: 'garden', translation: 'jardín', example: 'The garden is beautiful.' },
  { word: 'journey', translation: 'viaje', example: 'The journey was long.' },
];

type Strategy = 'context' | 'audio' | 'retrieval';
type Phase = 'home' | 'lesson' | 'result' | 'retention';
type Retention = { due24h: boolean; due7d: boolean; immediate: number; retention24h: number | null; retention7d: number | null; createdAt: number };

const STRATEGIES: { key: Strategy; title: string; subtitle: string }[] = [
  { key: 'context', title: 'Contexto', subtitle: 'Aprende dentro de una situación' },
  { key: 'audio', title: 'Audio', subtitle: 'Escucha y reconoce' },
  { key: 'retrieval', title: 'Recuperación', subtitle: 'Recuerda sin pistas' },
];

const STORAGE_KEY = '@lu_experiment';
const DAY = 24 * 60 * 60 * 1000;

export default function App() {
  const [screen, setScreen] = useState<Phase>('home');
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [scores, setScores] = useState<Record<Strategy, number>>({ context: 0, audio: 0, retrieval: 0 });
  const [retention, setRetention] = useState<Retention | null>(null);
  const [retentionScore, setRetentionScore] = useState(0);

  useEffect(() => {
    loadExperiment();
  }, []);

  const loadExperiment = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: Retention = JSON.parse(raw);
      setRetention(data);
      if ((data.due7d && Date.now() >= data.createdAt + 7 * DAY) || (data.due24h && Date.now() >= data.createdAt + DAY)) {
        setScreen('retention');
      }
    } catch (error) {
      console.log('No se pudo cargar el experimento', error);
    }
  };

  const current = WORDS[wordIndex];
  const options = useMemo(() => {
    const others = WORDS.filter((w) => w.word !== current.word).slice(0, 2).map((w) => w.translation);
    return [current.translation, ...others].sort(() => Math.random() - 0.5);
  }, [wordIndex]);

  const start = () => {
    setScreen('lesson'); setStrategyIndex(0); setWordIndex(0); setCorrect(0);
    setScores({ context: 0, audio: 0, retrieval: 0 }); setSelected(null); setStartedAt(Date.now());
  };

  const answer = (value: string) => {
    if (selected) return;
    setSelected(value);
    const isCorrect = value === current.translation;
    if (isCorrect) {
      setCorrect((v) => v + 1);
      setScores((s) => ({ ...s, [strategy.key]: s[strategy.key] + 1 }));
    }
  };

  const next = () => {
    if (wordIndex < WORDS.length - 1) { setWordIndex((v) => v + 1); setSelected(null); return; }
    if (strategyIndex < STRATEGIES.length - 1) { setStrategyIndex((v) => v + 1); setWordIndex(0); setSelected(null); return; }
    finishExperiment();
  };

  const finishExperiment = async () => {
    const data: Retention = { due24h: true, due7d: true, immediate: correct, retention24h: null, retention7d: null, createdAt: Date.now() };
    setRetention(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setScreen('result');
  };

  const completeRetention = async () => {
    if (!retention) return;
    const updated = { ...retention };
    if (Date.now() >= retention.createdAt + 7 * DAY) updated.retention7d = retentionScore;
    else if (Date.now() >= retention.createdAt + DAY) updated.retention24h = retentionScore;
    else return;
    setRetention(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setScreen('home');
  };

  const retentionLabel = retention && retention.retention7d === null && Date.now() >= retention.createdAt + DAY ? 'Tu prueba de 24 h está lista.' : 'Tu prueba de retención está lista.';

  if (screen === 'home') return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>LÜ</Text><Text style={styles.eyebrow}>TU ENTRENAMIENTO ADAPTATIVO</Text>
      <Text style={styles.title}>Aprende idiomas descubriendo qué funciona contigo.</Text>
      <Text style={styles.description}>LÜ prueba diferentes estrategias, mide tu desempeño y construye progresivamente tu perfil de aprendizaje.</Text>
      {retention && (retention.retention24h === null || retention.retention7d === null) && <TouchableOpacity style={styles.retentionCard} onPress={() => setScreen('retention')}><Text style={styles.cardTitle}>{retentionLabel}</Text><Text style={styles.cardText}>Tus respuestas de hoy ayudarán a LÜ a medir qué estrategia retienes mejor.</Text></TouchableOpacity>}
      <View style={styles.card}><Text style={styles.cardTitle}>Español → Inglés</Text><Text style={styles.cardText}>Primera sesión experimental</Text><View style={styles.statsRow}><View><Text style={styles.stat}>15</Text><Text style={styles.label}>palabras</Text></View><View><Text style={styles.stat}>3</Text><Text style={styles.label}>estrategias</Text></View><View><Text style={styles.stat}>7 días</Text><Text style={styles.label}>retención</Text></View></View></View>
      <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>{STRATEGIES.map((item, i) => <View style={styles.strategy} key={item.key}><View style={styles.number}><Text style={styles.numberText}>{i + 1}</Text></View><View><Text style={styles.strategyTitle}>{item.title}</Text><Text style={styles.strategyText}>{item.subtitle}</Text></View></View>)}
      <TouchableOpacity style={styles.primary} onPress={start}><Text style={styles.primaryText}>Comenzar experimento</Text></TouchableOpacity>
    </ScrollView></SafeAreaView>
  );

  if (screen === 'retention') return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.resultContainer}>
      <Text style={styles.eyebrow}>MEDICIÓN DE RETENCIÓN</Text><Text style={styles.title}>¿Qué recuerdas hoy?</Text>
      <Text style={styles.description}>Selecciona la traducción que recuerdes para cada palabra. Esta medición se compara con tu resultado inicial.</Text>
      <View style={styles.contextBox}><Text style={styles.prompt}>¿Cómo se dice “window”?</Text></View>
      {['ventana', 'puerta', 'techo'].map((option) => <TouchableOpacity key={option} onPress={() => setRetentionScore(option === 'ventana' ? 1 : 0)} style={[styles.option, retentionScore === (option === 'ventana' ? 1 : 0) && styles.correct]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}
      <TouchableOpacity style={styles.primary} onPress={completeRetention}><Text style={styles.primaryText}>Guardar medición</Text></TouchableOpacity>
    </View></SafeAreaView>
  );

  if (screen === 'result') {
    const total = STRATEGIES.length * WORDS.length;
    const best = (Object.entries(scores) as [Strategy, number][]).sort((a, b) => b[1] - a[1])[0];
    const bestName = STRATEGIES.find((s) => s.key === best[0])?.title;
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.resultContainer}>
      <Text style={styles.eyebrow}>PRIMER EXPERIMENTO</Text><Text style={styles.title}>Ya tenemos tus primeros datos.</Text>
      <View style={styles.scoreCircle}><Text style={styles.score}>{correct}/{total}</Text><Text style={styles.label}>aciertos</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Señal inicial</Text><Text style={styles.cardText}>En esta sesión, tu mejor desempeño fue con {bestName}.</Text><Text style={styles.cardText}>Tiempo de sesión: {seconds} s.</Text></View>
      <Text style={styles.note}>LÜ todavía no te etiqueta por una “forma de aprender”. Ahora medirá tu retención a 24 h y 7 días.</Text>
      <TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Continuar</Text></TouchableOpacity>
    </View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.lessonContainer}>
    <View style={styles.topRow}><Text style={styles.logoSmall}>LÜ</Text><Text style={styles.progress}>{strategyIndex + 1}/3 · {wordIndex + 1}/{WORDS.length}</Text></View>
    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((strategyIndex * WORDS.length + wordIndex + 1) / (STRATEGIES.length * WORDS.length)) * 100}%` }]} /></View>
    <Text style={styles.eyebrow}>{strategy.title.toUpperCase()}</Text><Text style={styles.lessonTitle}>{strategy.subtitle}</Text>
    {strategy.key === 'context' && <View style={styles.contextBox}><Text style={styles.emoji}>🏡</Text><Text style={styles.example}>{current.example}</Text></View>}
    {strategy.key === 'audio' && <TouchableOpacity style={styles.audioBox} onPress={() => {}}><Text style={styles.audioIcon}>▶</Text><Text style={styles.example}>Escucha: “{current.word}”</Text></TouchableOpacity>}
    {strategy.key === 'retrieval' && <View style={styles.contextBox}><Text style={styles.prompt}>¿Cómo se dice en inglés?</Text><Text style={styles.bigSpanish}>{current.translation}</Text></View>}
    <Text style={styles.question}>{strategy.key === 'retrieval' ? 'Selecciona tu respuesta:' : <>¿Qué significa <Text style={styles.bold}>{current.word}</Text>?</>}</Text>
    <View style={styles.options}>{options.map((option) => { const isSelected = selected === option; const isCorrect = option === current.translation; return <TouchableOpacity key={option} disabled={!!selected} onPress={() => answer(option)} style={[styles.option, isSelected && (isCorrect ? styles.correct : styles.incorrect)]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>; })}</View>
    <View style={styles.bottom}>{selected && <Text style={selected === current.translation ? styles.feedbackGood : styles.feedbackBad}>{selected === current.translation ? '✓ Correcto' : `La respuesta era: ${current.translation}`}</Text>}<TouchableOpacity style={[styles.primary, !selected && styles.disabled]} disabled={!selected} onPress={next}><Text style={styles.primaryText}>{wordIndex === WORDS.length - 1 && strategyIndex === STRATEGIES.length - 1 ? 'Ver resultados' : 'Continuar'}</Text></TouchableOpacity></View>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F8F7F3'},container:{padding:28,paddingBottom:40},lessonContainer:{flex:1,padding:24},resultContainer:{flex:1,padding:28,justifyContent:'center'},logo:{fontSize:42,fontWeight:'900',letterSpacing:-3,marginBottom:40},logoSmall:{fontSize:24,fontWeight:'900',letterSpacing:-2},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,opacity:.55,marginBottom:12},title:{fontSize:38,lineHeight:43,fontWeight:'800',letterSpacing:-1.2,marginBottom:18},description:{fontSize:17,lineHeight:26,opacity:.7,marginBottom:28},card:{backgroundColor:'#EAE8E0',borderRadius:24,padding:22,marginBottom:30},retentionCard:{backgroundColor:'#DCD9CF',borderRadius:24,padding:22,marginBottom:20},cardTitle:{fontSize:21,fontWeight:'800',marginBottom:6},cardText:{fontSize:15,lineHeight:22,opacity:.68,marginTop:4},statsRow:{flexDirection:'row',justifyContent:'space-between',marginTop:24},stat:{fontSize:22,fontWeight:'800'},label:{fontSize:11,opacity:.55,marginTop:2},sectionTitle:{fontSize:20,fontWeight:'800',marginBottom:16},strategy:{flexDirection:'row',alignItems:'center',marginBottom:17},number:{width:34,height:34,borderRadius:17,backgroundColor:'#151515',alignItems:'center',justifyContent:'center',marginRight:13},numberText:{color:'#fff',fontWeight:'800'},strategyTitle:{fontSize:16,fontWeight:'700'},strategyText:{fontSize:13,opacity:.58,marginTop:2},primary:{backgroundColor:'#151515',paddingVertical:17,borderRadius:16,alignItems:'center',marginTop:20},primaryText:{color:'#fff',fontSize:16,fontWeight:'800'},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},progress:{fontSize:13,opacity:.55,fontWeight:'700'},progressBar:{height:5,backgroundColor:'#E1DFD7',borderRadius:4,marginTop:18,marginBottom:45,overflow:'hidden'},progressFill:{height:'100%',backgroundColor:'#151515'},lessonTitle:{fontSize:29,lineHeight:34,fontWeight:'800',marginBottom:28},contextBox:{backgroundColor:'#EAE8E0',borderRadius:24,padding:25,alignItems:'center',marginBottom:25},audioBox:{backgroundColor:'#EAE8E0',borderRadius:24,padding:25,flexDirection:'row',alignItems:'center',marginBottom:25},audioIcon:{width:48,height:48,borderRadius:24,backgroundColor:'#151515',color:'#fff',textAlign:'center',paddingTop:14,marginRight:16,overflow:'hidden'},emoji:{fontSize:50,marginBottom:12},example:{fontSize:19,fontWeight:'700',textAlign:'center'},prompt:{fontSize:15,opacity:.6,marginBottom:8},bigSpanish:{fontSize:28,fontWeight:'800'},question:{fontSize:18,marginBottom:15,opacity:.7},bold:{fontWeight:'800',opacity:1},options:{gap:10},option:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E0D9',padding:17,borderRadius:15,marginBottom:10},optionText:{fontSize:16,fontWeight:'700'},correct:{borderColor:'#222',backgroundColor:'#E5E5DF'},incorrect:{opacity:.55},bottom:{marginTop:'auto'},feedbackGood:{fontWeight:'800',marginBottom:4},feedbackBad:{fontWeight:'700',marginBottom:4},disabled:{opacity:.35},scoreCircle:{width:150,height:150,borderRadius:75,backgroundColor:'#EAE8E0',alignSelf:'center',alignItems:'center',justifyContent:'center',marginVertical:28},score:{fontSize:38,fontWeight:'900'},note:{fontSize:14,lineHeight:21,opacity:.62,marginBottom:10}
});
