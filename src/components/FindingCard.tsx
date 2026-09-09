import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HazardFinding } from '../types/inspection';

type Props = { finding: HazardFinding | null; visible: boolean; onClose: () => void };

export function FindingCard({ finding, visible, onClose }: Props) {
  if (!finding) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Ficha del hallazgo</Text>
          <Info label="Hallazgo" value={finding.title} />
          <Info label="Tipo de peligro" value={finding.hazardType} />
          <Info label="Categoría de riesgo" value={finding.riskCategory} />
          <Info label="Nivel de riesgo" value={finding.riskLevel} highlight />
          <Info label="Descripción" value={finding.description} />
          <Info label="Recomendación" value={finding.recommendation} />
          <Info label="Confianza de la detección" value={`${finding.confidence}%`} />
          {finding.capturedPhotoUri ? <Info label="Foto capturada" value="Guardada automáticamente para el informe." /> : null}

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.secondary]} onPress={() => {}}>
              <Text style={styles.secondaryText}>Desglosar</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.warning]} onPress={() => {}}>
              <Text style={styles.warningText}>Corregir</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.primary]} onPress={onClose}>
              <Text style={styles.primaryText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  infoRow: { gap: 4 },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  value: { color: '#0f172a', fontSize: 15, lineHeight: 21 },
  highlight: { color: '#dc2626', fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 12 },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#e0f2fe' },
  warning: { backgroundColor: '#fef3c7' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryText: { color: '#0369a1', fontWeight: '800' },
  warningText: { color: '#92400e', fontWeight: '800' },
});
