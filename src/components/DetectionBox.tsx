import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { HazardFinding } from '../types/inspection';

type Props = { finding: HazardFinding; onPress: () => void };

export function DetectionBox({ finding, onPress }: Props) {
  const { boundingBox } = finding;
  return (
    <Pressable
      accessibilityLabel={`Abrir ficha de ${finding.title}`}
      onPress={onPress}
      style={[styles.box, { left: `${boundingBox.x * 100}%`, top: `${boundingBox.y * 100}%`, width: `${boundingBox.width * 100}%`, height: `${boundingBox.height * 100}%` }]}
    >
      <Text style={styles.label}>{finding.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', borderWidth: 3, borderColor: '#ef4444', borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  label: { position: 'absolute', top: -30, left: 0, backgroundColor: '#ef4444', color: '#fff', fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
});
