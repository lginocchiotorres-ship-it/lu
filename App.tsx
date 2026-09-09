import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { WORDS, STRATEGIES } from './src/data';
import { adaptiveOrder, bestStrategy, dueRetention, getStats, strategyScore, createRetentionRecord } from './src/adaptive';
import { Answer, LearningData, Strategy, Word } from './src/types';

type Screen = 'home' | 'lesson' | 'result' | 'retention' | 'profile';
const STORAGE_KEY = '@lu_learning_data_v3';
const STRATEGY_KEYS: Strategy[] = ['context', 'audio', 'retrieval'];
const emptyData = (): LearningData => ({ sessions: [], retention: [] });
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeOptions(current: Word) {
  return [current.word, ...WORDS.filter((w) => w.id !== current.id).slice(0, 3).map((w) => w.word)].sort(() => Math.random() - 0.5);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<LearningData>(emptyData());
  const [lesson, setLesson] = useState<Array<Word & { strategy: Strategy }>>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [retentionRecordId, setRetentionRecordId] = useState<string | null>(null);
  const [retentionIndex, setRetentionIndex] = useState(0);
  const [retentionAnswers, setRetentionAnswers] = useState<Answer[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (error) { console.log('LÜ storage error', error); }
  }

  async function persist(next: LearningData) {
    setData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const current = lesson[index];
  const options = useMemo(() => current ? makeOptions(current) : [], [current?.id, index]);
  const pendingRetention = dueRetention(data);
  const best = bestStrategy(data);
  const stats = getStats(data);

  function startLesson() {
    const order = adaptiveOrder(data);
    const selectedWords = WORDS.slice(0, 5);
    const nextLesson = order.flatMap((strategy) => selectedWords.map((word) => ({ ...word, strategy })));
    const newSessionId = id();
    setLesson(nextLesson); setIndex(0); setSelected(null); setAnswers([]); setAttempts(0); setHints(0);
    setSessionId(newSessionId); setQuestionStartedAt(Date.now()); setScreen('lesson');
  }

  function answer(value: string) {
    if (!current || selected) return;
    const correct = value === current.word;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts); setSelected(value);
    setAnswers((prev) => [...prev, { wordId: current.id, strategy: current.strategy, correct, responseMs: Date.now() - questionStartedAt, attempts: nextAttempts, hints }]);
  }

  function useHint() { if (current && !selected) setHints((value) => value + 1); }

  async function nextQuestion() {
    if (!selected || !current) return;
    if (index < lesson.length - 1) {
      setIndex((value) => value + 1); setSelected(null); setAttempts(0); setHints(0); setQuestionStartedAt(Date.now()); return;
    }
    await finishLesson();
  }

  async function finishLesson() {
    const session = { id: sessionId, createdAt: Date.now(), answers };
    const nextData: LearningData = {
      ...data,
      sessions: [...data.sessions, session],
      retention: [...data.retention, createRetentionRecord(session.id, session.createdAt, 24), createRetentionRecord(session.id, session.createdAt, 168)],
    };
    await persist(nextData); setScreen('result');
  }

  function beginRetention(recordId: string) {
    setRetentionRecordId(recordId); setRetentionIndex(0); setRetentionAnswers([]); setScreen('retention');
  }

  function answerRetention(value: string, item: Word & { strategy: Strategy }) {
    if (retentionAnswers.length > retentionIndex) return;
    const correct = value === item.word;
    setRetentionAnswers((prev) => [...prev, { wordId: item.id, strategy: item.strategy, correct, responseMs: 0, attempts: 1, hints: 0 }]);
  }

  async function finishRetention() {
    if (!retentionRecordId) return;
    const target = data.retention.find((r) => r.sessionId === retentionRecordId && r.completedAt === null && r.dueAt <= Date.now());
    if (!target) return;
    const finalRetention = data.retention.map((record) => record.sessionId === retentionRecordId && record.dueAt === target.dueAt ? { ...record, completedAt: Date.now(), answers: retentionAnswers } : record);
    await persist({ ...data, retention: finalRetention }); setScreen('home');
  }

  function retentionWords(record: { sessionId: string }) {
    const session = data.sessions.find((s) => s.id === record.sessionId);
    if (!session) return [];
    return session.answers.map((a) => {
      const word = WORDS.find((w) => w.id === a.wordId);
      return word ? { ...word, strategy: a.strategy } : null;
    }).filter(Boolean) as Array<Word & { strategy: Strategy }>;
  }

  if (screen === 'home') {
    const completed = data.sessions.length;
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><View><Text style={styles.logo}>LÜ</Text><Text style={styles.logoSub}>language intelligence</Text></View><TouchableOpacity onPress={() => setScreen('profile')}><Text style={styles.profileButton}>Mi perfil</Text></TouchableOpacity></View>
      <View style={styles.hero}><Text style={styles.eyebrow}>ENTRENAMIENTO ADAPTATIVO</Text><Text style={styles.title}>Descubre cómo aprendes idiomas.</Text><Text style={styles.description}>LÜ experimenta con distintas estrategias, mide tu aprendizaje real y adapta las siguientes sesiones a tu evidencia.</Text></View>
      {pendingRetention && <TouchableOpacity style={styles.retentionCard} onPress={() => beginRetention(pendingRetention.sessionId)}><Text style={styles.cardTitle}>{pendingRetention.horizon === 24 ? '🕐 Medición de 24 horas' : '✦ Medición de 7 días'}</Text><Text style={styles.cardText}>Tu prueba está lista. Completarla ayuda a LÜ a medir aprendizaje duradero.</Text><Text style={styles.link}>Empezar medición →</Text></TouchableOpacity>}
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Español → Inglés</Text><Text style={styles.level}>MVP</Text></View><Text style={styles.cardText}>{completed === 0 ? 'Primera sesión experimental' : `${completed} sesión${completed === 1 ? '' : 'es'} registrada${completed === 1 ? '' : 's'}`}</Text><View style={styles.statsRow}><View><Text style={styles.stat}>15</Text><Text style={styles.label}>ítems</Text></View><View><Text style={styles.stat}>3</Text><Text style={styles.label}>estrategias</Text></View><View><Text style={styles.stat}>{data.retention.filter((r) => r.completedAt).length}</Text><Text style={styles.label}>retenciones</Text></View></View></View>
      {best && <View style={styles.signal}><Text style={styles.signalEyebrow}>SEÑAL ACTUAL</Text><Text style={styles.signalTitle}>{STRATEGIES.find((s) => s.key === best)?.title}</Text><Text style={styles.cardText}>No es una etiqueta de “estilo”. Es la estrategia con mejor evidencia acumulada hasta ahora.</Text></View>}
      <Text style={styles.sectionTitle}>El experimento</Text>{STRATEGIES.map((s, i) => <View style={styles.strategy} key={s.key}><View style={styles.number}><Text style={styles.numberText}>{i + 1}</Text></View><View style={styles.strategyBody}><Text style={styles.strategyTitle}>{s.icon} {s.title}</Text><Text style={styles.strategyText}>{s.subtitle}</Text></View></View>)}
      <TouchableOpacity style={styles.primary} onPress={startLesson}><Text style={styles.primaryText}>{completed ? 'Entrenar de nuevo' : 'Comenzar experimento'}</Text></TouchableOpacity><Text style={styles.footer}>La personalización de LÜ se construye con datos de rendimiento, no con etiquetas.</Text>
    </ScrollView></SafeAreaView>;
  }

  if (screen === 'lesson' && current) {
    const strategy = STRATEGIES.find((s) => s.key === current.strategy)!;
    const isContext = current.strategy === 'context'; const isAudio = current.strategy === 'audio'; const isRetrieval = current.strategy === 'retrieval';
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.lessonContainer}>
      <View style={styles.topRow}><Text style={styles.logoSmall}>LÜ</Text><Text style={styles.progress}>{index + 1} / {lesson.length}</Text></View><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((index + 1) / lesson.length) * 100}%` }]} /></View>
      <Text style={styles.strategyPill}>{strategy.icon} {strategy.title.toUpperCase()}</Text>
      {isContext && <View style={styles.contextBox}><Text style={styles.contextLabel}>SITUACIÓN</Text><Text style={styles.contextText}>{current.context.replace(current.word, '_____')}</Text></View>}
      {isAudio && <View style={styles.audioBox}><Text style={styles.audioTitle}>Escucha la palabra</Text><TouchableOpacity style={styles.audioButton} onPress={() => Speech.speak(current.word, { language: 'en-US', rate: 0.82 })}><Text style={styles.audioButtonText}>▶  Reproducir</Text></TouchableOpacity><Text style={styles.audioHint}>Escucha y luego recupera la palabra.</Text></View>}
      {isRetrieval && <View style={styles.retrievalBox}><Text style={styles.contextLabel}>SIN PISTAS</Text><Text style={styles.bigSpanish}>{current.translation}</Text><Text style={styles.retrievalText}>¿Qué palabra en inglés recuerdas?</Text></View>}
      {isContext && <Text style={styles.question}>¿Qué palabra completa la situación?</Text>}{isAudio && <Text style={styles.question}>¿Qué palabra escuchaste?</Text>}
      <View style={styles.options}>{options.map((option) => { const correct = option === current.word; const chosen = selected === option; return <TouchableOpacity key={option} disabled={!!selected} onPress={() => answer(option)} style={[styles.option, chosen && (correct ? styles.correct : styles.wrong), selected && correct && styles.correct]}><Text style={[styles.optionText, selected && correct && styles.correctText]}>{option}</Text></TouchableOpacity>; })}</View>
      {!selected && <TouchableOpacity onPress={useHint} style={styles.hint}><Text style={styles.hintText}>💡 {hints ? `Pista usada (${hints})` : 'Usar una pista'}</Text></TouchableOpacity>}{hints > 0 && !selected && <Text style={styles.hintDetail}>Pista: la palabra comienza con “{current.word[0]}”.</Text>}
      {selected && <View style={styles.feedback}><Text style={styles.feedbackTitle}>{selected === current.word ? '✓ Correcto' : `La respuesta era “${current.word}”`}</Text><Text style={styles.feedbackText}>{current.example}</Text></View>}
      <View style={styles.bottom}><Text style={styles.progressText}>{strategy.title} · dificultad {current.difficulty}/3</Text><TouchableOpacity disabled={!selected} style={[styles.primary, !selected && styles.disabled]} onPress={nextQuestion}><Text style={styles.primaryText}>{index === lesson.length - 1 ? 'Terminar sesión' : 'Continuar'}</Text></TouchableOpacity></View>
    </View></SafeAreaView>;
  }

  if (screen === 'result') {
    const last = data.sessions[data.sessions.length - 1]; const score = last?.answers.filter((a) => a.correct).length ?? 0;
    return <SafeAreaView style={styles.safe}><View style={styles.resultContainer}><Text style={styles.eyebrow}>SESIÓN COMPLETADA</Text><Text style={styles.title}>Tenemos una nueva medición.</Text><View style={styles.scoreCircle}><Text style={styles.score}>{score}/{last?.answers.length ?? 0}</Text><Text style={styles.label}>aciertos</Text></View><View style={styles.card}><Text style={styles.cardTitle}>Ahora viene la parte importante.</Text><Text style={styles.cardText}>LÜ medirá cuánto recuerdas después de 24 horas y 7 días. La retención tendrá más peso que el resultado inmediato al actualizar tu perfil.</Text></View><TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Volver al inicio</Text></TouchableOpacity></View></SafeAreaView>;
  }

  if (screen === 'retention') {
    const record = data.retention.find((r) => r.sessionId === retentionRecordId && r.completedAt === null && r.dueAt <= Date.now()); const words = record ? retentionWords(record) : []; const item = words[retentionIndex];
    if (!item) return <SafeAreaView style={styles.safe}><View style={styles.resultContainer}><Text style={styles.title}>No hay medición pendiente.</Text><TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Volver</Text></TouchableOpacity></View></SafeAreaView>;
    const alreadyAnswered = retentionAnswers.length > retentionIndex; const retentionOptions = makeOptions(item);
    return <SafeAreaView style={styles.safe}><View style={styles.lessonContainer}><Text style={styles.eyebrow}>RETENCIÓN · {record?.horizon === 24 ? '24 HORAS' : '7 DÍAS'}</Text><Text style={styles.lessonTitle}>¿Qué recuerdas sin volver a estudiar?</Text><View style={styles.retrievalBox}><Text style={styles.contextLabel}>RECUERDA</Text><Text style={styles.bigSpanish}>{item.translation}</Text></View><Text style={styles.question}>Selecciona la palabra que recuerdes.</Text><View style={styles.options}>{retentionOptions.map((option) => <TouchableOpacity key={option} disabled={alreadyAnswered} onPress={() => answerRetention(option, item)} style={[styles.option, alreadyAnswered && option === item.word && styles.correct]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}</View>{alreadyAnswered && <View style={styles.feedback}><Text style={styles.feedbackTitle}>{retentionAnswers[retentionIndex]?.correct ? '✓ Recordaste la palabra' : `La respuesta era “${item.word}”`}</Text><Text style={styles.feedbackText}>Esta respuesta se atribuirá a la estrategia con la que aprendiste el término.</Text></View>}<View style={styles.bottom}><Text style={styles.progressText}>{retentionIndex + 1}/{words.length}</Text><TouchableOpacity disabled={!alreadyAnswered} style={[styles.primary, !alreadyAnswered && styles.disabled]} onPress={async () => { if (retentionIndex < words.length - 1) setRetentionIndex((v) => v + 1); else await finishRetention(); }}><Text style={styles.primaryText}>{retentionIndex === words.length - 1 ? 'Guardar medición' : 'Continuar'}</Text></TouchableOpacity></View></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}><TouchableOpacity onPress={() => setScreen('home')}><Text style={styles.back}>← Inicio</Text></TouchableOpacity><Text style={styles.eyebrow}>PERFIL DE EVIDENCIA</Text><Text style={styles.title}>Tu perfil cambia con tus datos.</Text><Text style={styles.description}>LÜ no te clasifica. Compara señales de rendimiento y retención por estrategia.</Text>{STRATEGY_KEYS.map((key) => { const s = stats[key]; const score = Math.round(strategyScore(s)); const avg = s.attempts ? Math.round(s.totalResponseMs / s.attempts) : 0; return <View style={styles.profileCard} key={key}><View style={styles.profileRow}><Text style={styles.strategyTitle}>{STRATEGIES.find((x) => x.key === key)?.title}</Text>{best === key && <Text style={styles.badge}>MEJOR SEÑAL</Text>}</View><View style={styles.bar}><View style={[styles.barFill, { width: `${score}%` }]} /></View><Text style={styles.cardText}>Puntuación experimental: {score}/100</Text><Text style={styles.cardText}>Aciertos: {s.correct}/{s.attempts} · respuesta media: {avg ? `${avg} ms` : '—'}</Text><Text style={styles.cardText}>Retención 24 h: {s.retention24Total ? `${Math.round((s.retention24Correct / s.retention24Total) * 100)}%` : 'pendiente'} · 7 días: {s.retention7Total ? `${Math.round((s.retention7Correct / s.retention7Total) * 100)}%` : 'pendiente'}</Text></View>; })}<View style={styles.card}><Text style={styles.cardTitle}>Cómo decide LÜ</Text><Text style={styles.cardText}>La puntuación combina desempeño inmediato, retención a 24 h, retención a 7 días, velocidad y uso de pistas. La retención pesa más porque queremos medir aprendizaje durable.</Text></View><TouchableOpacity style={styles.reset} onPress={() => Alert.alert('Reiniciar datos', 'Esto borrará las sesiones y mediciones de este dispositivo.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Borrar', style: 'destructive', onPress: async () => { await persist(emptyData()); setScreen('home'); } }])}><Text style={styles.resetText}>Reiniciar experimento</Text></TouchableOpacity></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FBF9FF' }, container: { padding: 24, paddingBottom: 40 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }, logo: { fontSize: 40, fontWeight: '900', color: '#6C4AB6', letterSpacing: -2 }, logoSub: { fontSize: 9, color: '#9A8DB5', letterSpacing: 1.4, marginTop: -5 }, logoSmall: { fontSize: 24, fontWeight: '900', color: '#6C4AB6' }, profileButton: { color: '#6C4AB6', fontWeight: '700' }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#8D78B5', marginBottom: 10 }, hero: { marginBottom: 24 }, title: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: '#292331', letterSpacing: -1 }, description: { fontSize: 16, lineHeight: 24, color: '#6E6678', marginTop: 14 }, card: { backgroundColor: '#F0EAFE', borderRadius: 24, padding: 20, marginBottom: 14 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, cardTitle: { fontSize: 19, fontWeight: '800', color: '#332A40', marginBottom: 6 }, cardText: { color: '#71677E', lineHeight: 21 }, level: { backgroundColor: '#FFF', color: '#6C4AB6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', fontSize: 10, fontWeight: '800' }, statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }, stat: { fontSize: 23, fontWeight: '800', color: '#4A3863' }, label: { fontSize: 11, color: '#877C93', marginTop: 2 }, retentionCard: { backgroundColor: '#E8DDFB', borderWidth: 1, borderColor: '#D2BDF5', borderRadius: 22, padding: 19, marginBottom: 14 }, link: { color: '#6945A9', fontWeight: '800', marginTop: 10 }, signal: { backgroundColor: '#332A40', borderRadius: 24, padding: 20, marginBottom: 26 }, signalEyebrow: { color: '#CDBCF0', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, signalTitle: { color: '#FFF', fontSize: 25, fontWeight: '800', marginVertical: 5 }, sectionTitle: { fontSize: 22, fontWeight: '800', color: '#302737', marginBottom: 16 }, strategy: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, number: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E9DFFC', justifyContent: 'center', alignItems: 'center', marginRight: 13 }, numberText: { color: '#6945A9', fontWeight: '800' }, strategyBody: { flex: 1 }, strategyTitle: { fontSize: 16, fontWeight: '800', color: '#342B3F' }, strategyText: { fontSize: 13, color: '#83788C', marginTop: 3 }, primary: { backgroundColor: '#6C4AB6', minHeight: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 16 }, primaryText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.35 }, footer: { textAlign: 'center', color: '#9A91A3', fontSize: 12, marginTop: 18, lineHeight: 18 }, lessonContainer: { flex: 1, padding: 24 }, topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progress: { color: '#8A8093', fontWeight: '700' }, progressBar: { height: 6, backgroundColor: '#E9E3EF', borderRadius: 6, marginTop: 15, marginBottom: 24, overflow: 'hidden' }, progressFill: { height: 6, backgroundColor: '#8B68D0' }, strategyPill: { alignSelf: 'flex-start', backgroundColor: '#EEE5FC', color: '#6C4AB6', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, fontSize: 11, fontWeight: '800', overflow: 'hidden' }, contextBox: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginTop: 20, borderWidth: 1, borderColor: '#ECE6F2' }, contextLabel: { color: '#9A8DB0', fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 10 }, contextText: { color: '#453B4D', fontSize: 20, lineHeight: 29, fontWeight: '600' }, audioBox: { backgroundColor: '#F0EAFE', borderRadius: 24, padding: 24, marginTop: 20, alignItems: 'center' }, audioTitle: { fontSize: 20, fontWeight: '800', color: '#3A3045' }, audioButton: { backgroundColor: '#6C4AB6', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginTop: 16 }, audioButtonText: { color: '#FFF', fontWeight: '800' }, audioHint: { color: '#7E718D', fontSize: 12, marginTop: 10 }, retrievalBox: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginTop: 20, borderWidth: 1, borderColor: '#ECE6F2' }, bigSpanish: { fontSize: 30, fontWeight: '800', color: '#352C3F' }, retrievalText: { color: '#766A7D', marginTop: 8 }, question: { fontSize: 19, fontWeight: '800', color: '#342B3F', marginTop: 25, marginBottom: 14 }, options: { gap: 10 }, option: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#DDD5E5', backgroundColor: '#FFF', justifyContent: 'center', paddingHorizontal: 18 }, optionText: { color: '#413748', fontSize: 16, fontWeight: '700' }, correct: { backgroundColor: '#E5F4E8', borderColor: '#8BC697' }, correctText: { color: '#276C36' }, wrong: { backgroundColor: '#F9E6E6', borderColor: '#E0A2A2' }, hint: { marginTop: 14, alignSelf: 'center', padding: 8 }, hintText: { color: '#7657A5', fontWeight: '700' }, hintDetail: { textAlign: 'center', color: '#887B94', fontSize: 12 }, feedback: { backgroundColor: '#F4F0F7', borderRadius: 18, padding: 15, marginTop: 15 }, feedbackTitle: { color: '#463A50', fontWeight: '800' }, feedbackText: { color: '#786D80', marginTop: 5, lineHeight: 19 }, bottom: { marginTop: 'auto' }, progressText: { color: '#8A8093', fontSize: 12 }, lessonTitle: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: '#302737', marginTop: 6 }, resultContainer: { flex: 1, padding: 24, justifyContent: 'center' }, scoreCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#EEE5FC', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginVertical: 30 }, score: { fontSize: 38, fontWeight: '900', color: '#60409D' }, note: { color: '#817688', lineHeight: 21, marginTop: 12 }, back: { color: '#6C4AB6', fontWeight: '800', marginBottom: 28 }, profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1, borderColor: '#E9E1EF' }, profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, badge: { color: '#6C4AB6', fontSize: 9, fontWeight: '900', backgroundColor: '#EEE5FC', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, overflow: 'hidden' }, bar: { height: 8, backgroundColor: '#ECE6F0', borderRadius: 8, overflow: 'hidden', marginVertical: 12 }, barFill: { height: 8, backgroundColor: '#8B68D0' }, reset: { alignItems: 'center', padding: 20 }, resetText: { color: '#A04E5A', fontWeight: '700' },
});
