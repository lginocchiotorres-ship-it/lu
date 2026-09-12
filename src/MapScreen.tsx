import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MAP_GROUPS, MapNode } from './mapData';

type Props = {
  userName?: string;
  completedNodeIds?: string[];
  onNodePress?: (node: MapNode) => void;
};

const { width } = Dimensions.get('window');

export default function MapScreen({ userName = 'explorador', completedNodeIds = [], onNodePress }: Props) {
  const groups = useMemo(() => MAP_GROUPS.map(group => ({
    ...group,
    nodes: group.nodes.map(node => ({
      ...node,
      completed: completedNodeIds.includes(node.id),
    })),
  })), [completedNodeIds]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>LÜ</Text>
          <Text style={styles.greeting}>Hola, {userName} ✦</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>🐱</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.map}>
        <View style={styles.skyDecor}><View style={styles.sun}><Text>☀</Text></View><Text style={styles.cloud}>☁</Text><Text style={styles.cloudTwo}>☁</Text></View>

        {groups.map((group, groupIndex) => (
          <View key={group.id} style={styles.group}>
            <View style={styles.groupTitle}>
              <View>
                <Text style={styles.groupEyebrow}>CAPÍTULO {group.id}</Text>
                <Text style={styles.groupName}>{group.title}</Text>
                <Text style={styles.groupSubtitle}>{group.subtitle}</Text>
              </View>
              {!group.unlocked && <View style={styles.lockPill}><Text style={styles.lockText}>🔒</Text></View>}
            </View>

            <View style={styles.pathArea}>
              <View style={styles.pathBack} />
              {group.nodes.map((node, index) => {
                const locked = !group.unlocked || !node.unlocked;
                const left = node.position === 'left' ? 16 : node.position === 'right' ? width - 142 : width / 2 - 56;
                return (
                  <View key={node.id} style={[styles.nodeWrap, { left, top: index * 126 }]}>
                    <TouchableOpacity
                      activeOpacity={locked ? 1 : 0.82}
                      disabled={locked}
                      onPress={() => onNodePress?.(node)}
                      style={[styles.node, node.completed && styles.nodeCompleted, locked && styles.nodeLocked]}
                    >
                      <Text style={styles.nodeIcon}>{locked ? '🔒' : node.icon}</Text>
                    </TouchableOpacity>
                    <View style={[styles.nodeLabel, locked && styles.nodeLabelLocked]}>
                      <Text style={styles.nodeName}>{node.name}</Text>
                      <Text style={styles.nodeZone}>{node.zone}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {groupIndex < groups.length - 1 && <View style={styles.travel}><Text style={styles.travelEmoji}>🚗</Text><Text style={styles.travelText}>{groups[groupIndex + 1].unlocked ? 'Sigue el camino' : 'Sigue jugando para descubrirlo'}</Text></View>}
          </View>
        ))}

        <View style={styles.bottomCard}>
          <Text style={styles.bottomIcon}>🌎</Text>
          <Text style={styles.bottomTitle}>Tu historia apenas comienza</Text>
          <Text style={styles.bottomText}>Explora cada lugar. No estudies: escucha, juega, descubre.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF3E8' },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF3E8', zIndex: 5 },
  brand: { fontSize: 30, fontWeight: '900', color: '#E85A4F', letterSpacing: 2 },
  greeting: { marginTop: 1, fontSize: 14, fontWeight: '700', color: '#2B2B2B' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E9B44C', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#2B2B2B' },
  avatarText: { fontSize: 25 },
  map: { paddingBottom: 44, paddingTop: 6 },
  skyDecor: { height: 48, position: 'relative' },
  sun: { position: 'absolute', right: 28, top: 2, width: 42, height: 42, borderRadius: 21, backgroundColor: '#E9B44C', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2B2B2B' },
  cloud: { position: 'absolute', left: 28, top: 6, fontSize: 32, color: '#E5E0D8' },
  cloudTwo: { position: 'absolute', left: 118, top: 20, fontSize: 24, color: '#E5E0D8' },
  group: { paddingHorizontal: 18, marginBottom: 4 },
  groupTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  groupEyebrow: { fontSize: 11, fontWeight: '900', color: '#2D6A4F', letterSpacing: 1.4 },
  groupName: { marginTop: 2, fontSize: 22, fontWeight: '900', color: '#2B2B2B' },
  groupSubtitle: { marginTop: 3, fontSize: 13, color: '#6B4E71', maxWidth: width - 80 },
  lockPill: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center' },
  lockText: { fontSize: 17 },
  pathArea: { height: 392, position: 'relative', overflow: 'hidden', borderRadius: 30, backgroundColor: '#D9C9B6', borderWidth: 2, borderColor: '#2B2B2B' },
  pathBack: { position: 'absolute', width: 42, height: 450, left: width / 2 - 39, top: -28, backgroundColor: '#C97B5A', borderRadius: 24, transform: [{ rotate: '-10deg' }] },
  nodeWrap: { position: 'absolute', width: 112, alignItems: 'center' },
  node: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#E85A4F', borderWidth: 4, borderColor: '#2B2B2B', alignItems: 'center', justifyContent: 'center', shadowColor: '#2B2B2B', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  nodeCompleted: { backgroundColor: '#E9B44C', borderColor: '#E85A4F' },
  nodeLocked: { backgroundColor: '#E5E0D8', borderColor: '#2B2B2B', opacity: 0.9 },
  nodeIcon: { fontSize: 32 },
  nodeLabel: { marginTop: 6, minWidth: 104, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FAF3E8', borderWidth: 1.5, borderColor: '#2B2B2B', alignItems: 'center' },
  nodeLabelLocked: { backgroundColor: '#E5E0D8' },
  nodeName: { fontSize: 12, fontWeight: '900', color: '#2B2B2B' },
  nodeZone: { marginTop: 1, fontSize: 9, color: '#6B4E71' },
  travel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  travelEmoji: { fontSize: 21 },
  travelText: { fontSize: 12, fontWeight: '800', color: '#6B4E71' },
  bottomCard: { marginHorizontal: 18, marginTop: 18, padding: 20, borderRadius: 24, backgroundColor: '#2D6A4F', borderWidth: 2, borderColor: '#2B2B2B', alignItems: 'center' },
  bottomIcon: { fontSize: 28 },
  bottomTitle: { marginTop: 7, fontSize: 18, fontWeight: '900', color: '#FAF3E8' },
  bottomText: { marginTop: 5, fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#FAF3E8' },
});
