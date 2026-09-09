import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

type Strategy = 'context' | 'audio' | 'retrieval';
type Screen = 'home' | 'lesson' | 'result' | 'retention' | 'profile';
type Word = { word: string; translation: string; example: string; strategy: Strategy };
type Answer = { word: string; strategy: Strategy; correct: boolean; responseMs: number };
type Experiment = {
  createdAt: number;
  immediate: Record<Strategy, number>;
  retention24: Record<Strategy, number> | null;
  retention7: Record<Strategy, number> | null;
  answers: Answer[];
};

const WORDS: Omit<Word, 'strategy'>[] = [
  { word: 'window', translation: 'ventana', example: 'Open the window, please.' },
  { word: 'backpack', translation: 'mochila', example: 'My backpack is blue.' },
  { word: 'bridge', translation: 'puente', example: 'We crossed the bridge.' },
  { word: 'garden', translation: 'jardín', example: 'The garden is beautiful.' },
  { word: 'journey', translation: 'viaje', example: 'The journey was long.' },
];

const STRATEGIES: { key: Strategy; title: string; subtitle: string }[] = [
  { key: 'context', title: 'Contexto', subtitle: 'Aprende dentro de una situación' },
  { key: 'audio', title: 'Audio', subtitle: 'Escucha y reconoce' },
  { key: 'retrieval', title: 'Recuperación', subtitle: 'Recuerda sin pistas' },
];

const STORAGE_KEY = '@lu_experiment_v2';
const DAY = 24 * 60 * 60 * 1000;
const emptyScores = (): Record<Strategy, number> => ({ context: 0, audio: 0, retrieval: 0 });

function buildLesson(order: Strategy[]) {
  return order.flatMap((strategy) => WORDS.map((w) => ({ ...w, strategy })));
}

function adaptiveOrder(experiment: Experiment | null): Strategy[] {
  if (!experiment) return ['context', 'audio', 'retrieval'];
  const score = (s: Strategy) => {
    let value = experiment.immediate[s] / 5;
    if (experiment.retention24) value += (experiment.retention24[s] / 5) * 1.5;
    if (experiment.retention7) value += (experiment.retention7[s] / 5) * 2;
    return value;
  };
  return (['context', 'audio', 'retrieval'] as Strategy[]).sort((a, b) => score(a) - score(b));
}

function bestStrategy(experiment: Experiment | null) {
  if (!experiment) return null;
  const order = (['context', 'audio', 'retrieval'] as Strategy[]).map((s) => {
    let score = experiment.immediate[s] / 5;
    if (experiment.retention24) score += (experiment.retention24[s] / 5) * 1.5;
    if (experiment.retention7) score += (experiment.retention7[s] / 5) * 2;
    return { strategy: s, score };
  });
  return order.sort((a, b) => b.score - a.score)[0].strategy;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [lesson, setLesson] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [retentionAnswers, setRetentionAnswers] = useState<Record<number, boolean>>({});
  const [retentionIndex, setRetentionIndex] = useState(0);

  useEffect(() => { loadExperiment(); }, []);

  const loadExperiment = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setExperiment(JSON.parse(raw));
    } catch (e) {
      console.log('LÜ: no se pudo cargar el experimento', e);
    }
  };

  const current = lesson[index];
  const options = useMemo(() => {
    if (!current) return [];
    const others = WORDS.filter((w) => w.word !== current.word).slice(0, 2).map((w) => w.translation);
    return [current.translation, ...others].sort(() => Math.random() - 0.5);
  }, [index, lesson]);

  const startLesson = () => {
    const order = adaptiveOrder(experiment);
    setLesson(buildLesson(order));
    setIndex(0); setSelected(null); setAnswers([]); setStartedAt(Date.now()); setQuestionStartedAt(Date.now());
    setScreen('lesson');
  };

  const answer = (value: string) => {
    if (selected || !current) return;
    const responseMs = Date.now() - questionStartedAt;
    const correct = value === current.translation;
    setSelected(value);
    setAnswers((prev) => [...prev, { word: current.word, strategy: current.strategy, correct, responseMs }]);
  };

  const next = () => {
    if (!selected) return;
    if (index < lesson.length - 1) {
      setIndex((v) => v + 1); setSelected(null); setQuestionStartedAt(Date.now()); return;
    }
    finishLesson();
  };

  const finishLesson = async () => {
    const immediate = emptyScores();
    answers.forEach((a) => { if (a.correct) immediate[a.strategy] += 1; });
    const data: Experiment = { createdAt: Date.now(), immediate, retention24: null, retention7: null, answers };
    setExperiment(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setScreen('result');
  };

  const retentionWords = useMemo(() => {
    if (!experiment) return [];
    const order: Strategy[] = ['context', 'audio', 'retrieval'];
    return buildLesson(order);
  }, [experiment]);

  const retentionDue = (hours: number) => !!experiment && Date.now() >= experiment.createdAt + hours * 60 * 60 * 1000;
  const is7Day = !!experiment && experiment.retention24 !== null && retentionDue(168) && experiment.retention7 === null;
  const is24Hour = !!experiment && experiment.retention24 === null && retentionDue(24);
  const hasPendingRetention = is24Hour || is7Day;

  const beginRetention = () => {
    setRetentionIndex(0); setRetentionAnswers({}); setScreen('retention');
  };

  const finishRetention = async () => {
    if (!experiment) return;
    const scores = emptyScores();
    retentionWords.forEach((w, i) => { if (retentionAnswers[i]) scores[w.strategy] += 1; });
    const updated: Experiment = is7Day
      ? { ...experiment, retention7: scores }
      : { ...experiment, retention24: scores };
    setExperiment(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setScreen('home');
  };

  const speak = () => {
    if (current) Speech.speak(current.word, { language: 'en-US', rate: 0.85 });
  };

  if (screen === 'home') {
    const best = bestStrategy(experiment);
    const bestName = STRATEGIES.find((s) => s.key === best)?.title;
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>LÜ</Text><TouchableOpacity onPress={() => setScreen('profile')}><Text style={styles.profileButton}>Mi perfil</Text></TouchableOpacity></View>
      <Text style={styles.eyebrow}>TU ENTRENAMIENTO ADAPTATIVO</Text>
      <Text style={styles.title}>Aprende idiomas descubriendo qué funciona contigo.</Text>
      <Text style={styles.description}>LÜ no te etiqueta como “visual” o “auditivo”. Experimenta, mide tu retención y adapta tu entrenamiento según tus propios datos.</Text>

      {hasPendingRetention && <TouchableOpacity style={styles.retentionCard} onPress={beginRetention}><Text style={styles.cardTitle}>{is7Day ? 'Tu prueba de 7 días está lista' : 'Tu prueba de 24 horas está lista'}</Text><Text style={styles.cardText}>Hazla ahora para que LÜ pueda comparar tu retención por estrategia.</Text></TouchableOpacity>}

      <View style={styles.card}><Text style={styles.cardTitle}>Español → Inglés</Text><Text style={styles.cardText}>{experiment ? 'Siguiente sesión adaptativa' : 'Primera sesión experimental'}</Text><View style={styles.statsRow}><View><Text style={styles.stat}>15</Text><Text style={styles.label}>ítems</Text></View><View><Text style={styles.stat}>3</Text><Text style={styles.label}>estrategias</Text></View><View><Text style={styles.stat}>{experiment?.retention7 ? '7 días ✓' : '7 días'}</Text><Text style={styles.label}>retención</Text></View></View></View>

      {bestName && <View style={styles.signal}><Text style={styles.signalEyebrow}>SEÑAL ACTUAL</Text><Text style={styles.signalTitle}>{bestName}</Text><Text style={styles.cardText}>Es la estrategia con mayor puntuación acumulada hasta ahora. LÜ seguirá comprobándolo con nuevas sesiones.</Text></View>}

      <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
      {STRATEGIES.map((item, i) => <View style={styles.strategy} key={item.key}><View style={styles.number}><Text style={styles.numberText}>{i + 1}</Text></View><View><Text style={styles.strategyTitle}>{item.title}</Text><Text style={styles.strategyText}>{item.subtitle}</Text></View></View>)}
      <TouchableOpacity style={styles.primary} onPress={startLesson}><Text style={styles.primaryText}>{experiment ? 'Continuar entrenamiento' : 'Comenzar experimento'}</Text></TouchableOpacity>
    </ScrollView></SafeAreaView>;
  }

  if (screen === 'profile') {
    const best = bestStrategy(experiment);
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => setScreen('home')}><Text style={styles.back}>← Inicio</Text></TouchableOpacity>
      <Text style={styles.eyebrow}>PERFIL DE ESTRATEGIAS</Text><Text style={styles.title}>Tu perfil cambia con tus datos.</Text>
      <Text style={styles.description}>Estas puntuaciones no son “estilos de aprendizaje”. Son señales experimentales de cuánto has rendido y retenido con cada estrategia.</Text>
      {STRATEGIES.map((s) => {
        const immediate = experiment?.immediate[s.key] ?? 0;
        const r24 = experiment?.retention24?.[s.key] ?? null;
        const r7 = experiment?.retention7?.[s.key] ?? null;
        return <View style={styles.profileCard} key={s.key}><View style={styles.profileRow}><Text style={styles.strategyTitle}>{s.title}</Text>{best === s.key && <Text style={styles.badge}>MEJOR SEÑAL</Text>}</View><Text style={styles.cardText}>Inmediato: {immediate}/5</Text><Text style={styles.cardText}>24 h: {r24 === null ? 'pendiente' : `${r24}/5`}</Text><Text style={styles.cardText}>7 días: {r7 === null ? 'pendiente' : `${r7}/5`}</Text></View>;
      })}
      <View style={styles.card}><Text style={styles.cardTitle}>Principio de LÜ</Text><Text style={styles.cardText}>No asumimos cómo aprendes. LÜ formula una hipótesis, la prueba y la actualiza con evidencia de tu propio rendimiento.</Text></View>
    </ScrollView></SafeAreaView>;
  }

  if (screen === 'retention') {
    const item = retentionWords[retentionIndex];
    if (!item) return null;
    const answerValue = retentionAnswers[retentionIndex];
    const retentionOptions = [item.translation, 'puerta', 'camino'].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5);
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.lessonContainer}>
      <Text style={styles.eyebrow}>RETENCIÓN · {is7Day ? '7 DÍAS' : '24 HORAS'}</Text><Text style={styles.lessonTitle}>¿Qué recuerdas sin volver a estudiar?</Text>
      <View style={styles.contextBox}><Text style={styles.prompt}>¿Cómo se dice en inglés?</Text><Text style={styles.bigSpanish}>{item.translation}</Text></View>
      <Text style={styles.question}>Selecciona lo que recuerdes:</Text>
      <View style={styles.options}>{retentionOptions.map((option) => <TouchableOpacity key={option} disabled={answerValue !== undefined} onPress={() => setRetentionAnswers((p) => ({ ...p, [retentionIndex]: option === item.translation }))} style={[styles.option, answerValue !== undefined && option === item.translation && styles.correct]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}</View>
      <View style={styles.bottom}><Text style={styles.progressText}>{retentionIndex + 1}/{retentionWords.length}</Text><TouchableOpacity style={[styles.primary, answerValue === undefined && styles.disabled]} disabled={answerValue === undefined} onPress={() => { if (retentionIndex < retentionWords.length - 1) setRetentionIndex((v) => v + 1); else finishRetention(); }}><Text style={styles.primaryText}>{retentionIndex === retentionWords.length - 1 ? 'Guardar retención' : 'Continuar'}</Text></TouchableOpacity></View>
    </View></SafeAreaView>;
  }

  if (screen === 'result') {
    const total = lesson.length; const score = answers.filter((a) => a.correct).length;
    const immediate = emptyScores(); answers.forEach((a) => { if (a.correct) immediate[a.strategy] += 1; });
    const best = (Object.entries(immediate) as [Strategy, number][]).sort((a, b) => b[1] - a[1])[0][0];
    const bestName = STRATEGIES.find((s) => s.key === best)?.title;
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.resultContainer}>
      <Text style={styles.eyebrow}>PRIMERA MEDICIÓN</Text><Text style={styles.title}>Ya tenemos una señal inicial.</Text>
      <View style={styles.scoreCircle}><Text style={styles.score}>{score}/{total}</Text><Text style={styles.label}>aciertos</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Mejor desempeño inicial</Text><Text style={styles.cardText}>{bestName} · {immediate[best]}/5</Text><Text style={styles.cardText}>LÜ ahora esperará las mediciones de 24 h y 7 días para saber qué estrategia retienes mejor.</Text></View>
      <Text style={styles.note}>Una sesión no define tu perfil. El algoritmo necesita observar varias mediciones antes de aumentar el peso de una estrategia.</Text>
      <TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Ver mi entrenamiento</Text></TouchableOpacity>
    </View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.lessonContainer}>
    <View style={styles.topRow}><Text style={styles.logoSmall}>LÜ</Text><Text style={styles.progress}>{index + 1}/{lesson.length}</Text></View>
    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((index + 1) / lesson.length) * 100}%` }]} /></View>
    <Text style={styles.eyebrow}>{STRATEGIES.find((s) => s.key === current?.strategy)?.title?.toUpperCase()}</Text><Text style={styles.lessonTitle}>{STRATEGIES.find((s) => s.key === current?.strategy)?.subtitle}</Text>
    {current?.strategy === 'context' && <View style={styles.contextBox}><Text style={styles.emoji}>🏡</Text><Text style={styles.example}>{current.example}</Text></View>}
    {current?.strategy === 'audio' && <TouchableOpacity style={styles.audioBox} onPress={speak}><Text style={styles.audioIcon}>▶</Text><View><Text style={styles.example}>Escucha la palabra</Text><Text style={styles.cardText}>Toca para reproducir “{current.word}”</Text></View></TouchableOpacity>}
    {current?.strategy === 'retrieval' && <View style={styles.contextBox}><Text style={styles.prompt}>Recuperación activa</Text><Text style={styles.bigSpanish}>{current.translation}</Text></View>}
    <Text style={styles.question}>{current?.strategy === 'retrieval' ? '¿Cuál es la palabra en inglés?' : <>¿Qué significa <Text style={styles.bold}>{current?.word}</Text>?</>}</Text>
    <View style={styles.options}>{options.map((option) => { const isSelected = selected === option; const isCorrect = option === current.translation; return <TouchableOpacity key={option} disabled={!!selected} onPress={() => answer(option)} style={[styles.option, isSelected && (isCorrect ? styles.correct : styles.incorrect)]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>; })}</View>
    <View style={styles.bottom}>{selected && <Text style={selected === current.translation ? styles.feedbackGood : styles.feedbackBad}>{selected === current.translation ? '✓ Correcto' : `La respuesta era: ${current.translation}`}</Text>}<TouchableOpacity style={[styles.primary, !selected && styles.disabled]} disabled={!selected} onPress={next}><Text style={styles.primaryText}>{index === lesson.length - 1 ? 'Ver resultados' : 'Continuar'}</Text></TouchableOpacity></View>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F8F7F3'},container:{padding:28,paddingBottom:40},lessonContainer:{flex:1,padding:24},resultContainer:{flex:1,padding:28,justifyContent:'center'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:38},logo:{fontSize:42,fontWeight:'900',letterSpacing:-3},profileButton:{fontSize:14,fontWeight:'800'},back:{fontSize:15,fontWeight:'800',marginBottom:35},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,opacity:.55,marginBottom:12},title:{fontSize:38,lineHeight:43,fontWeight:'800',letterSpacing:-1.2,marginBottom:18},description:{fontSize:17,lineHeight:26,opacity:.7,marginBottom:28},card:{backgroundColor:'#EAE8E0',borderRadius:24,padding:22,marginBottom:20},retentionCard:{backgroundColor:'#DCD9CF',borderRadius:24,padding:22,marginBottom:20},signal:{borderWidth:1,borderColor:'#D9D6CC',borderRadius:24,padding:22,marginBottom:28},signalEyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,opacity:.5,marginBottom:7},signalTitle:{fontSize:24,fontWeight:'900',marginBottom:4},cardTitle:{fontSize:21,fontWeight:'800',marginBottom:6},cardText:{fontSize:15,lineHeight:22,opacity:.68,marginTop:4},statsRow:{flexDirection:'row',justifyContent:'space-between',marginTop:24},stat:{fontSize:22,fontWeight:'800'},label:{fontSize:11,opacity:.55,marginTop:2},sectionTitle:{fontSize:20,fontWeight:'800',marginBottom:16},strategy:{flexDirection:'row',alignItems:'center',marginBottom:17},number:{width:34,height:34,borderRadius:17,backgroundColor:'#151515',alignItems:'center',justifyContent:'center',marginRight:13},numberText:{color:'#fff',fontWeight:'800'},strategyTitle:{fontSize:16,fontWeight:'700'},strategyText:{fontSize:13,opacity:.58,marginTop:2},primary:{backgroundColor:'#151515',paddingVertical:17,borderRadius:16,alignItems:'center',marginTop:20},primaryText:{color:'#fff',fontSize:16,fontWeight:'800'},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logoSmall:{fontSize:24,fontWeight:'900',letterSpacing:-2},progress:{fontSize:13,opacity:.55,fontWeight:'700'},progressText:{fontSize:13,opacity:.55,fontWeight:'700',textAlign:'center'},progressBar:{height:5,backgroundColor:'#E1DFD7',borderRadius:4,marginTop:18,marginBottom:45,overflow:'hidden'},progressFill:{height:'100%',backgroundColor:'#151515'},lessonTitle:{fontSize:29,lineHeight:34,fontWeight:'800',marginBottom:28},contextBox:{backgroundColor:'#EAE8E0',borderRadius:24,padding:25,alignItems:'center',marginBottom:25},audioBox:{backgroundColor:'#EAE8E0',borderRadius:24,padding:22,flexDirection:'row',alignItems:'center',marginBottom:25},audioIcon:{width:48,height:48,borderRadius:24,backgroundColor:'#151515',color:'#fff',textAlign:'center',paddingTop:14,marginRight:16,overflow:'hidden'},emoji:{fontSize:50,marginBottom:12},example:{fontSize:19,fontWeight:'700',textAlign:'center'},prompt:{fontSize:15,opacity:.6,marginBottom:8},bigSpanish:{fontSize:28,fontWeight:'800'},question:{fontSize:18,marginBottom:15,opacity:.7},bold:{fontWeight:'800',opacity:1},options:{gap:10},option:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E0D9',padding:17,borderRadius:15},optionText:{fontSize:16,fontWeight:'700'},correct:{borderColor:'#222',backgroundColor:'#E5E5DF'},incorrect:{opacity:.55},bottom:{marginTop:'auto'},feedbackGood:{fontWeight:'800',marginBottom:4},feedbackBad:{fontWeight:'700',marginBottom:4},disabled:{opacity:.35},scoreCircle:{width:150,height:150,borderRadius:75,backgroundColor:'#EAE8E0',alignSelf:'center',alignItems:'center',justifyContent:'center',marginVertical:28},score:{fontSize:38,fontWeight:'900'},note:{fontSize:14,lineHeight:21,opacity:.62,marginBottom:10},profileCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E0D9',borderRadius:20,padding:20,marginBottom:12},profileRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},badge:{fontSize:9,fontWeight:'900',letterSpacing:1,opacity:.55}
});
