import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LANGUAGE_PAIRS } from './languages';

export default function LanguagePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#6F6678', marginBottom: 10 }}>IDIOMA DE APRENDIZAJE</Text>
      {LANGUAGE_PAIRS.map(pair => {
        const active = pair.id === value;
        return (
          <TouchableOpacity key={pair.id} onPress={() => onChange(pair.id)} style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: active ? '#5B438D' : '#E5DFEA', backgroundColor: active ? '#F0EBF8' : '#FFFFFF', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#30263A' }}>{pair.sourceLabel} → {pair.targetLabel}</Text>
            <Text style={{ marginTop: 3, color: '#766B7F' }}>{active ? 'Activo para tu entrenamiento' : 'Seleccionar idioma'}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
