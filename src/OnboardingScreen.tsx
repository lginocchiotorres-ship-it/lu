import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = { onComplete: (name: string, companion: 'mimi' | 'pipo' | 'nubo') => void };

const companions = [
  { id: 'mimi' as const, name: 'Mimi', emoji: '🐱', line: "Let's go!", colors: '#E85A4F' },
  { id: 'pipo' as const, name: 'Pipo', emoji: '🐦', line: 'No worries!', colors: '#3A7CA5' },
  { id: 'nubo' as const, name: 'Nubo', emoji: '☁️', line: 'Take your time.', colors: '#6B4E71' },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [companion, setCompanion] = useState<Props['onComplete'] extends (name: string, companion: infer C) => void ? C : never>('mimi');
  const canContinue = name.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.decor}><Text style={styles.cloud}>☁</Text><Text style={styles.sun}>☀</Text></View>
      <View style={styles.content}>
        <Text style={styles.logo}>LÜ</Text>
        <Text style={styles.title}>No aprendas un idioma.</Text>
        <Text style={styles.titleAccent}>Vívelo.</Text>
        <Text style={styles.subtitle}>Tu viaje por el inglés empieza aquí.</Text>

        <Text style={styles.label}>¿Cómo te llamamos?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor="#9A9187"
          style={styles.input}
          maxLength={24}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Elige a tu compañero</Text>
        <View style={styles.companions}>
          {companions.map(item => {
            const active = companion === item.id;
            return (
              <TouchableOpacity key={item.id} onPress={() => setCompanion(item.id as any)} style={[styles.companion, active && { borderColor: item.colors, backgroundColor: '#FFF8EF' }]}>
                <Text style={styles.companionEmoji}>{item.emoji}</Text>
                <Text style={styles.companionName}>{item.name}</Text>
                <Text style={styles.companionLine}>{item.line}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity disabled={!canContinue} onPress={() => onComplete(name.trim(), companion as any)} style={[styles.button, !canContinue && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Comenzar mi viaje</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF3E8' },
  decor: { height: 70, position: 'relative' },
  cloud: { position: 'absolute', left: 25, top: 20, fontSize: 38, color: '#E5E0D8' },
  sun: { position: 'absolute', right: 28, top: 18, fontSize: 34, color: '#E9B44C' },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 28 },
  logo: { marginTop: 6, fontSize: 48, fontWeight: '900', letterSpacing: 4, color: '#E85A4F' },
  title: { marginTop: 8, fontSize: 29, lineHeight: 34, fontWeight: '900', color: '#2B2B2B' },
  titleAccent: { fontSize: 31, lineHeight: 36, fontWeight: '900', color: '#2D6A4F' },
  subtitle: { marginTop: 7, fontSize: 15, color: '#6B4E71' },
  label: { marginTop: 25, marginBottom: 8, fontSize: 12, fontWeight: '900', color: '#2B2B2B', letterSpacing: 0.7 },
  input: { height: 52, borderRadius: 17, borderWidth: 2, borderColor: '#2B2B2B', backgroundColor: '#FFFFFF', paddingHorizontal: 16, fontSize: 16, color: '#2B2B2B' },
  companions: { flexDirection: 'row', gap: 9 },
  companion: { flex: 1, minHeight: 112, borderRadius: 18, borderWidth: 2, borderColor: '#D9C9B6', backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center', padding: 7 },
  companionEmoji: { fontSize: 30 },
  companionName: { marginTop: 2, fontSize: 13, fontWeight: '900', color: '#2B2B2B' },
  companionLine: { marginTop: 2, fontSize: 8, color: '#6B4E71', textAlign: 'center' },
  button: { marginTop: 'auto', minHeight: 56, borderRadius: 19, backgroundColor: '#E85A4F', borderWidth: 2, borderColor: '#2B2B2B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontSize: 16, fontWeight: '900', color: '#FAF3E8' },
  arrow: { fontSize: 21, fontWeight: '900', color: '#FAF3E8' },
});
