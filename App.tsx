import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { WORDS, STRATEGIES } from './src/data';
import { adaptiveOrder, bestStrategy, dueRetention, getStats, strategyScore, createRetentionRecord } from './src/adaptive';
import { Answer, LearningData, Strategy, Word } from './src/types';

type Screen = 'home' | 'lesson' | 'result' | 'retention' | 'profile';
type LessonWord = Word & { strategy: Strategy };

const STORAGE_KEY = '@lu_learning_data_v4';
const STRATEGY_KEYS: Strategy[] = ['context', 'audio', 'retrieval'];
const emptyData = (): LearningData => ({ sessions: [], retention: [] });
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeOptions(current: Word) {
  const distractors = WORDS.filter((word) => word.id !== current.id).slice(0, 3).map((word) => word.word);
  return [current.word, ...distractors].sort(() => Math.random() - 0.5);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<LearningData>(emptyData());
  const [lesson, setLesson] = useState<LessonWord[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [retentionSessionId, setRetentionSessionId] = useState<string | null>(null);
  const [retentionIndex, setRetentionIndex] = useState(0);
  const [retentionAnswers, setRetentionAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try { setData(JSON.parse(raw)); } catch { setData(emptyData()); }
    });
  }, []);

  async function persist(next: LearningData) {
    setData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const current = lesson[index];
  const options = useMemo(() => current ? makeOptions(current) : [], [current?.id]);
  const pendingRetention = dueRetention(data);
  const stats = getStats(data);
  const best = bestStrategy(data);

  function startLesson() {
    const order = adaptiveOrder(data);
    const selectedWords = WORDS.slice(0, 5);
    const nextLesson = order.flatMap((strategy) => selectedWords.map((word) => ({ ...word, strategy })));
    setLesson(nextLesson);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setAttempts(0);
    setHints(0);
    setSessionId(makeId());
    setQuestionStartedAt(Date.now());
    setScreen('lesson');
  }

  function answer(value: string) {
    if (!current || selected) return;
    const correct = value === current.word;
    const nextAttempts = attempts + 1;
    const answerRecord: Answer = {
      wordId: current.id,
      strategy: current.strategy,
      correct,
      responseMs: Date.now() - questionStartedAt,
      attempts: nextAttempts,
      hints,
    };
    setAttempts(nextAttempts);
    setSelected(value);
    setAnswers((previous) => [...previous, answerRecord]);
  }

  function useHint() {
    if (!current || selected) return;
    setHints((value) => value + 1);
  }

  async function nextQuestion() {
    if (!selected || !current) return;
    if (index < lesson.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      setAttempts(0);
      setHints(0);
      setQuestionStartedAt(Date.now());
      return;
    }
    await finishLesson(answers);
  }

  async function finishLesson(finalAnswers: Answer[]) {
    const createdAt = Date.now();
    const session = { id: sessionId, createdAt, answers: finalAnswers };
    const nextData: LearningData = {
      ...data,
      sessions: [...data.sessions, session],
      retention: [
        ...data.retention,
        createRetentionRecord(session.id, createdAt, 24),
        createRetentionRecord(session.id, createdAt, 168),
      ],
    };
    await persist(nextData);
    setScreen('result');
  }

  function beginRetention(sessionToMeasure: string) {
    setRetentionSessionId(sessionToMeasure);
    setRetentionIndex(0);
    setRetentionAnswers([]);
    setScreen('retention');
  }

  function retentionWords(sessionToMeasure: string) {
    const session = data.sessions.find((item) => item.id === sessionToMeasure);
    if (!session) return [];
    return session.answers.map((answerRecord) => {
      const word = WORDS.find((item) => item.id === answerRecord.wordId);
      return word ? ({ ...word, strategy: answerRecord.strategy } as LessonWord) : null;
    }).filter(Boolean) as LessonWord[];
  }

  async function answerRetention(value: string, item: LessonWord) {
    if (retentionAnswers.length > retentionIndex) return;
    const answerRecord: Answer = {
      wordId: item.id,
      strategy: item.strategy,
      correct: value === item.word,
      responseMs: 0,
      attempts: 1,
      hints: 0,
    };
    setRetentionAnswers((previous) => [...previous, answerRecord]);
  }

  async function finishRetention(finalAnswers: Answer[]) {
    if (!retentionSessionId) return;
    const target = data.retention.find((record) => record.sessionId === retentionSessionId && record.completedAt === null && record.dueAt <= Date.now());
    if (!target) return;
    const completedAt = Date.now();
    const updatedRetention = data.retention.map((record) => {
      if (record.sessionId === retentionSessionId && record.horizon === target.horizon) {
        return { ...record, completedAt, answers: finalAnswers };
      }
      return record;
    });
    await persist({ ...data, retention: updatedRetention });
    setScreen('home');
  }

  if (screen === 'home') {
    const completed = data.sessions.length;
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>LÜ</Text>
              <Text style={styles.logoSub}>LANGUAGE INTELLIGENCE</Text>
            </View>
            <TouchableOpacity style={styles.profileChip} onPress={() => setScreen('profile')}>
              <Text style={styles.profileChipText}>Mi perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <View style={styles.moonBadge}><Text style={styles.moon}>☾</Text></View>
            <Text style={styles.eyebrow}>ENTRENAMIENTO ADAPTATIVO</Text>
            <Text style={styles.title}>Descubre cómo aprendes idiomas.</Text>
            <Text style={styles.description}>LÜ prueba distintas estrategias, mide tu retención y aprende qué funciona mejor para ti.</Text>
          </View>

          {pendingRetention && (
            <TouchableOpacity style={styles.retentionCard} onPress={() => beginRetention(pendingRetention.sessionId)}>
              <View style={styles.cardIcon}><Text style={styles.cardIconText}>↗</Text></View>
              <View style={styles.flex}><Text style={styles.cardTitle}>{pendingRetention.horizon === 24 ? 'Medición de 24 horas' : 'Medición de 7 días'}</Text><Text style={styles.cardText}>Tu recuerdo está listo para ser medido.</Text></View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <View><Text style={styles.cardTitle}>Español → Inglés</Text><Text style={styles.muted}>Experimento activo</Text></View>
              <View style={styles.levelBadge}><Text style={styles.levelText}>MVP</Text></View>
            </View>
            <View style={styles.statsRow}>
              <View><Text style={styles.stat}>{completed}</Text><Text style={styles.label}>sesiones</Text></View>
              <View><Text style={styles.stat}>3</Text><Text style={styles.label}>estrategias</Text></View>
              <View><Text style={styles.stat}>{data.retention.filter((r) => r.completedAt).length}</Text><Text style={styles.label}>retenciones</Text></View>
            </View>
          </View>

          {best && (
            <View style={styles.signalCard}>
              <Text style={styles.signalEyebrow}>TU SEÑAL ACTUAL</Text>
              <Text style={styles.signalTitle}>{STRATEGIES.find((item) => item.key === best)?.title}</Text>
              <Text style={styles.cardText}>La estrategia con mejor evidencia acumulada.</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Así funciona LÜ</Text>
          {STRATEGIES.map((strategy, i) => (
            <View style={styles.strategy} key={strategy.key}>
              <View style={styles.number}><Text style={styles.numberText}>{i + 1}</Text></View>
              <View style={styles.strategyBody}><Text style={styles.strategyTitle}>{strategy.icon} {strategy.title}</Text><Text style={styles.strategyText}>{strategy.subtitle}</Text></View>
            </View>
          ))}

          <TouchableOpacity style={styles.primary} onPress={startLesson}>
            <Text style={styles.primaryText}>{completed ? 'Continuar entrenando' : 'Comenzar experimento'}</Text>
            <Text style={styles.primaryArrow}>→</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>Tu perfil se construye con evidencia de rendimiento, no con etiquetas de “estilo de aprendizaje”.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'lesson' && current) {
    const strategy = STRATEGIES.find((item) => item.key === current.strategy)!;
    const isContext = current.strategy === 'context';
    const isAudio = current.strategy === 'audio';
    const isRetrieval = current.strategy === 'retrieval';
    const answeredCorrectly = selected === current.word;
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.lessonContainer}>
          <View style={styles.topRow}><Text style={styles.logoSmall}>LÜ</Text><Text style={styles.progress}>{index + 1} / {lesson.length}</Text></View>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((index + 1) / lesson.length) * 100}%` }]} /></View>
          <View style={styles.strategyPill}><Text style={styles.strategyPillText}>{strategy.icon} {strategy.title.toUpperCase()}</Text></View>

          {isContext && <View style={styles.contextBox}><Text style={styles.contextLabel}>EN CONTEXTO</Text><Text style={styles.contextText}>{current.context.replace(current.word, '_____')}</Text></View>}
          {isAudio && <View style={styles.audioBox}><View style={styles.audioCircle}><Text style={styles.audioSymbol}>♪</Text></View><Text style={styles.audioTitle}>Escucha y recupera</Text><TouchableOpacity style={styles.audioButton} onPress={() => Speech.speak(current.word, { language: 'en-US', rate: 0.82 })}><Text style={styles.audioButtonText}>▶  Reproducir palabra</Text></TouchableOpacity><Text style={styles.audioHint}>Puedes escucharla antes de responder.</Text></View>}
          {isRetrieval && <View style={styles.retrievalBox}><Text style={styles.contextLabel}>SIN PISTAS</Text><Text style={styles.bigSpanish}>{current.translation}</Text><Text style={styles.retrievalText}>Recupera la palabra en inglés desde tu memoria.</Text></View>}

          <Text style={styles.question}>{isRetrieval ? '¿Qué palabra recuerdas?' : isAudio ? '¿Qué palabra escuchaste?' : '¿Qué palabra completa la situación?'}</Text>
          <View style={styles.options}>{options.map((option) => {
            const correct = option === current.word;
            const chosen = selected === option;
            return <TouchableOpacity key={option} disabled={!!selected} onPress={() => answer(option)} style={[styles.option, chosen && (correct ? styles.correct : styles.wrong), selected && correct && styles.correct]}><Text style={[styles.optionText, selected && correct && styles.correctText]}>{option}</Text></TouchableOpacity>;
          })}</View>

          {!selected && <TouchableOpacity onPress={useHint} style={styles.hint}><Text style={styles.hintText}>💡 {hints ? `Pista usada (${hints})` : 'Usar una pista'}</Text></TouchableOpacity>}
          {hints > 0 && !selected && <Text style={styles.hintDetail}>Empieza con “{current.word[0]}”.</Text>}
          {selected && <View style={[styles.feedback, answeredCorrectly ? styles.feedbackGood : styles.feedbackNeutral]}><Text style={styles.feedbackTitle}>{answeredCorrectly ? '✓ Correcto' : `La respuesta era “${current.word}”`}</Text><Text style={styles.feedbackText}>{current.example}</Text></View>}

          <View style={styles.bottom}><Text style={styles.progressText}>{strategy.title} · dificultad {current.difficulty}/3</Text><TouchableOpacity disabled={!selected} style={[styles.primary, !selected && styles.disabled]} onPress={nextQuestion}><Text style={styles.primaryText}>{index === lesson.length - 1 ? 'Terminar sesión' : 'Continuar'}</Text><Text style={styles.primaryArrow}>→</Text></TouchableOpacity></View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'result') {
    const last = data.sessions[data.sessions.length - 1];
    const score = last?.answers.filter((item) => item.correct).length ?? 0;
    const total = last?.answers.length ?? 0;
    return <SafeAreaView style={styles.safe}><View style={styles.resultContainer}><View style={styles.resultIcon}><Text style={styles.resultStar}>✦</Text></View><Text style={styles.eyebrow}>SESIÓN COMPLETADA</Text><Text style={styles.title}>Nueva evidencia para LÜ.</Text><View style={styles.scoreCircle}><Text style={styles.score}>{score}/{total}</Text><Text style={styles.label}>aciertos</Text></View><View style={styles.mainCard}><Text style={styles.cardTitle}>Ahora medimos lo importante.</Text><Text style={styles.cardText}>LÜ te volverá a evaluar a las 24 horas y a los 7 días para saber qué estrategia produce mejor retención.</Text></View><TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Volver al inicio</Text><Text style={styles.primaryArrow}>→</Text></TouchableOpacity></View></SafeAreaView>;
  }

  if (screen === 'retention') {
    const record = data.retention.find((item) => item.sessionId === retentionSessionId && item.completedAt === null && item.dueAt <= Date.now());
    const words = record ? retentionWords(record.sessionId) : [];
    const item = words[retentionIndex];
    if (!item || !record) return <SafeAreaView style={styles.safe}><View style={styles.resultContainer}><Text style={styles.title}>No hay medición pendiente.</Text><TouchableOpacity style={styles.primary} onPress={() => setScreen('home')}><Text style={styles.primaryText}>Volver</Text></TouchableOpacity></View></SafeAreaView>;
    const alreadyAnswered = retentionAnswers.length > retentionIndex;
    const retentionOptions = makeOptions(item);
    return <SafeAreaView style={styles.safe}><View style={styles.lessonContainer}><Text style={styles.eyebrow}>RETENCIÓN · {record.horizon === 24 ? '24 HORAS' : '7 DÍAS'}</Text><Text style={styles.lessonTitle}>¿Qué recuerdas sin volver a estudiar?</Text><View style={styles.retrievalBox}><Text style={styles.contextLabel}>PALABRA EN ESPAÑOL</Text><Text style={styles.bigSpanish}>{item.translation}</Text></View><Text style={styles.question}>Selecciona la palabra que recuerdes.</Text><View style={styles.options}>{retentionOptions.map((option) => { const correct = option === item.word; const chosen = alreadyAnswered && retentionAnswers[retentionIndex]?.correct === correct && correct; return <TouchableOpacity key={option} disabled={alreadyAnswered} onPress={() => answerRetention(option, item)} style={[styles.option, alreadyAnswered && correct && styles.correct, alreadyAnswered && chosen && !correct && styles.wrong]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>; })}</View>{alreadyAnswered && <View style={styles.feedback}><Text style={styles.feedbackTitle}>{retentionAnswers[retentionIndex]?.correct ? '✓ Recordaste la palabra' : `La respuesta era “${item.word}”`}</Text><Text style={styles.feedbackText}>Esta respuesta se atribuye a la estrategia con la que aprendiste el término.</Text></View>}<View style={styles.bottom}><Text style={styles.progressText}>{retentionIndex + 1}/{words.length}</Text><TouchableOpacity disabled={!alreadyAnswered} style={[styles.primary, !alreadyAnswered && styles.disabled]} onPress={() => { if (retentionIndex < words.length - 1) { setRetentionIndex((value) => value + 1); } else { finishRetention(retentionAnswers); } }}><Text style={styles.primaryText}>{retentionIndex === words.length - 1 ? 'Guardar medición' : 'Continuar'}</Text><Text style={styles.primaryArrow}>→</Text></TouchableOpacity></View></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}><TouchableOpacity onPress={() => setScreen('home')}><Text style={styles.back}>← Inicio</Text></TouchableOpacity><Text style={styles.eyebrow}>PERFIL DE EVIDENCIA</Text><Text style={styles.title}>Tu aprendizaje, medido.</Text><Text style={styles.description}>Estas señales son hipótesis basadas en tus datos actuales, no etiquetas permanentes.</Text>{STRATEGY_KEYS.map((key) => { const value = strategyScore(stats[key]); const immediate = stats[key].attempts ? stats[key].correct / stats[key].attempts : 0; const r24 = stats[key].retention24Total ? stats[key].retention24Correct / stats[key].retention24Total : null; const r7 = stats[key].retention7Total ? stats[key].retention7Correct / stats[key].retention7Total : null; return <View style={styles.profileCard} key={key}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{STRATEGIES.find((item) => item.key === key)?.title}</Text><Text style={styles.profileScore}>{Math.round(value)}</Text></View><View style={styles.scoreBar}><View style={[styles.scoreBarFill, { width: `${value}%` }]} /></View><View style={styles.profileMetrics}><Text style={styles.metric}>Inmediato <Text style={styles.metricStrong}>{stats[key].attempts ? percent(immediate) : '—'}</Text></Text><Text style={styles.metric}>24 h <Text style={styles.metricStrong}>{r24 === null ? '—' : percent(r24)}</Text></Text><Text style={styles.metric}>7 d <Text style={styles.metricStrong}>{r7 === null ? '—' : percent(r7)}</Text></Text></View></View>; })}<View style={styles.mainCard}><Text style={styles.cardTitle}>¿Qué significa?</Text><Text style={styles.cardText}>LÜ combina rendimiento inmediato, velocidad, pistas y, sobre todo, retención para actualizar tu orden de entrenamiento.</Text></View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF9FF' },
  container: { padding: 22, paddingBottom: 38 },
  lessonContainer: { flex: 1, padding: 22, backgroundColor: '#FBF9FF' },
  resultContainer: { flex: 1, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF9FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  logo: { fontSize: 42, fontWeight: '900', color: '#6D28D9', letterSpacing: -3 },
  logoSmall: { fontSize: 28, fontWeight: '900', color: '#6D28D9', letterSpacing: -2 },
  logoSub: { fontSize: 9, fontWeight: '800', color: '#8B5CF6', letterSpacing: 2 },
  profileChip: { backgroundColor: '#EDE9FE', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18 },
  profileChipText: { color: '#6D28D9', fontWeight: '800', fontSize: 13 },
  hero: { backgroundColor: '#E9D5FF', borderRadius: 28, padding: 23, marginBottom: 16, overflow: 'hidden' },
  moonBadge: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  moon: { color: '#FFFFFF', fontSize: 29, marginTop: -3 },
  eyebrow: { color: '#7C3AED', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  title: { color: '#24133F', fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.7, marginBottom: 10 },
  description: { color: '#5B4A70', fontSize: 15, lineHeight: 22 },
  retentionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C4B5FD', borderRadius: 20, padding: 15, marginBottom: 16 },
  cardIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  flex: { flex: 1 },
  arrow: { color: '#7C3AED', fontSize: 30, fontWeight: '300' },
  mainCard: { backgroundColor: '#FFFFFF', borderRadius: 23, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EEE8F8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: '#2E1A47', fontSize: 17, fontWeight: '900' },
  muted: { color: '#9B8BAA', fontSize: 12, marginTop: 3 },
  cardText: { color: '#6D5C7D', fontSize: 14, lineHeight: 20 },
  levelBadge: { backgroundColor: '#6D28D9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  levelText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EBF6', paddingTop: 15 },
  stat: { color: '#6D28D9', fontSize: 25, fontWeight: '900', textAlign: 'center' },
  label: { color: '#9B8BAA', fontSize: 11, marginTop: 2, textAlign: 'center' },
  signalCard: { backgroundColor: '#7C3AED', borderRadius: 23, padding: 20, marginBottom: 25 },
  signalEyebrow: { color: '#DDD6FE', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  signalTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginBottom: 4 },
  sectionTitle: { color: '#2E1A47', fontSize: 20, fontWeight: '900', marginBottom: 12 },
  strategy: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: '#F0EBF6' },
  number: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: '#6D28D9', fontWeight: '900' },
  strategyBody: { flex: 1 },
  strategyTitle: { color: '#352044', fontSize: 15, fontWeight: '900' },
  strategyText: { color: '#81718F', fontSize: 12, marginTop: 2 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, marginTop: 13 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  primaryArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginLeft: 10 },
  disabled: { backgroundColor: '#C4B5FD' },
  footer: { textAlign: 'center', color: '#9B8BAA', fontSize: 11, lineHeight: 17, marginTop: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progress: { color: '#8B5CF6', fontWeight: '900', fontSize: 13 },
  progressBar: { height: 7, backgroundColor: '#EDE9FE', borderRadius: 5, overflow: 'hidden', marginBottom: 22 },
  progressFill: { height: 7, backgroundColor: '#7C3AED', borderRadius: 5 },
  strategyPill: { alignSelf: 'flex-start', backgroundColor: '#E9D5FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 18 },
  strategyPillText: { color: '#6D28D9', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  contextBox: { backgroundColor: '#FFFFFF', borderRadius: 23, padding: 22, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 22 },
  contextLabel: { color: '#8B5CF6', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
  contextText: { color: '#32203F', fontSize: 20, lineHeight: 29, fontWeight: '700' },
  audioBox: { backgroundColor: '#E9D5FF', borderRadius: 23, padding: 22, alignItems: 'center', marginBottom: 22 },
  audioCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  audioSymbol: { color: '#FFFFFF', fontSize: 28 },
  audioTitle: { color: '#352044', fontSize: 19, fontWeight: '900', marginBottom: 12 },
  audioButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15 },
  audioButtonText: { color: '#6D28D9', fontWeight: '900' },
  audioHint: { color: '#715C84', fontSize: 11, marginTop: 10 },
  retrievalBox: { backgroundColor: '#FFFFFF', borderRadius: 23, padding: 24, borderWidth: 2, borderColor: '#C4B5FD', marginBottom: 22 },
  bigSpanish: { color: '#6D28D9', fontSize: 32, fontWeight: '900', marginBottom: 5 },
  retrievalText: { color: '#75657F', fontSize: 13, lineHeight: 19 },
  question: { color: '#2E1A47', fontSize: 19, fontWeight: '900', marginBottom: 13 },
  options: { gap: 9 },
  option: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DDF0', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 17 },
  optionText: { color: '#3D2B4B', fontSize: 15, fontWeight: '700' },
  correct: { backgroundColor: '#E9D5FF', borderColor: '#8B5CF6' },
  correctText: { color: '#5B21B6' },
  wrong: { backgroundColor: '#F3E8FF', borderColor: '#A78BFA' },
  hint: { alignSelf: 'center', padding: 13 },
  hintText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },
  hintDetail: { color: '#8B5CF6', textAlign: 'center', fontSize: 12, marginBottom: 5 },
  feedback: { backgroundColor: '#F5F3FF', borderRadius: 17, padding: 15, marginTop: 12 },
  feedbackGood: { borderWidth: 1, borderColor: '#A78BFA' },
  feedbackNeutral: { borderWidth: 1, borderColor: '#DDD6FE' },
  feedbackTitle: { color: '#5B21B6', fontSize: 15, fontWeight: '900', marginBottom: 5 },
  feedbackText: { color: '#6D5C7D', fontSize: 13, lineHeight: 19 },
  bottom: { marginTop: 'auto', paddingTop: 14 },
  progressText: { color: '#9687A3', fontSize: 11, textAlign: 'center' },
  resultIcon: { width: 70, height: 70, borderRadius: 24, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resultStar: { color: '#FFFFFF', fontSize: 38 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 9, borderColor: '#C4B5FD', alignItems: 'center', justifyContent: 'center', marginVertical: 18, backgroundColor: '#FFFFFF' },
  score: { color: '#6D28D9', fontSize: 29, fontWeight: '900' },
  lessonTitle: { color: '#2E1A47', fontSize: 28, lineHeight: 33, fontWeight: '900', marginBottom: 18 },
  back: { color: '#6D28D9', fontWeight: '900', marginBottom: 25 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8F8' },
  profileScore: { color: '#6D28D9', fontSize: 23, fontWeight: '900' },
  scoreBar: { height: 9, backgroundColor: '#EDE9FE', borderRadius: 8, overflow: 'hidden', marginBottom: 13 },
  scoreBarFill: { height: 9, backgroundColor: '#7C3AED', borderRadius: 8 },
  profileMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { color: '#8A7998', fontSize: 11 },
  metricStrong: { color: '#4C2A66', fontWeight: '900' },
});
