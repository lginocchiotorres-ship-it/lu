import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DetectionBox } from '../components/DetectionBox';
import { FindingCard } from '../components/FindingCard';
import { detectHazards } from '../services/visionDetection';
import { HazardFinding } from '../types/inspection';

export function InspectionScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<HazardFinding | null>(null);

  const findings = useMemo(() => (isInspecting ? detectHazards({ cameraReady: Boolean(permission?.granted) }) : []), [isInspecting, permission?.granted]);

  const openFinding = async (finding: HazardFinding) => {
    let capturedPhotoUri: string | undefined;
    if (permission?.granted && cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      capturedPhotoUri = photo?.uri;
    }
    setSelectedFinding({ ...finding, capturedPhotoUri });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MVP de inspección</Text>
        <Text style={styles.title}>Seguridad industrial</Text>
      </View>

      <View style={styles.cameraFrame}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.cameraFallback}>
            <Text style={styles.fallbackTitle}>Vista de cámara preparada</Text>
            <Text style={styles.fallbackText}>Concede permiso de cámara para ver el entorno real. Mientras tanto se muestra un panel de demostración.</Text>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionText}>Activar cámara</Text>
            </Pressable>
          </View>
        )}

        {findings.slice(0, 1).map((finding) => (
          <DetectionBox key={finding.id} finding={finding} onPress={() => openFinding(finding)} />
        ))}
      </View>

      <View style={styles.panel}>
        <View>
          <Text style={styles.statusLabel}>Estado</Text>
          <Text style={styles.statusText}>{isInspecting ? 'Inspección activa: hallazgo simulado detectado' : 'Inspección detenida'}</Text>
        </View>
        <Pressable style={[styles.inspectButton, isInspecting && styles.stopButton]} onPress={() => setIsInspecting((value) => !value)}>
          <Text style={styles.inspectButtonText}>{isInspecting ? 'Detener inspección' : 'Iniciar inspección'}</Text>
        </Pressable>
      </View>

      <FindingCard visible={Boolean(selectedFinding)} finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  eyebrow: { color: '#93c5fd', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cameraFrame: { flex: 1, margin: 16, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1e293b' },
  cameraFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  fallbackTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  fallbackText: { color: '#cbd5e1', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  permissionButton: { backgroundColor: '#38bdf8', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  permissionText: { color: '#082f49', fontWeight: '900' },
  panel: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 20, gap: 16 },
  statusLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  statusText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  inspectButton: { alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, padding: 14 },
  stopButton: { backgroundColor: '#dc2626' },
  inspectButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
