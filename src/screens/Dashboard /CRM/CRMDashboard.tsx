import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CRMDashboard = () => {
  const navigation = useNavigation();
  const leadsSummary = [
    { label: 'New', value: 12, accent: styles.pillBlue },
    { label: 'Hot', value: 3, accent: styles.pillRed },
    { label: 'Won', value: 7, accent: styles.pillGreen },
  ];
  const todos = ['Call Kiran about proposal', 'Send onboarding email', 'Prepare demo deck'];
  const tasks = [
    { title: 'Follow up with Acme', status: 'In Progress', time: 'Due today' },
    { title: 'Update pipeline', status: 'Not Started', time: 'Due tomorrow' },
    { title: 'Schedule demo', status: 'Queued', time: 'This week' },
  ];

  const handleNotificationPress = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('Notifications' as never);
      return;
    }
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Header
        screenName="CRM"
        useGradient
        navigation={navigation as any}
        notificationCount={0}
        onNotificationPress={handleNotificationPress}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Pipeline</Text>
          <Text style={styles.heroTitle}>Grow relationships, faster.</Text>
          <Text style={styles.heroSub}>Stay on top of leads, tasks, and follow-ups.</Text>
          <View style={styles.pillsRow}>
            {leadsSummary.map((item) => (
              <View key={item.label} style={[styles.pill, item.accent]}>
                <Text style={styles.pillLabel}>{item.label}</Text>
                <Text style={styles.pillValue}>{item.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.heroActions}>
            <Pressable
              style={({ pressed }) => [styles.cta, styles.ctaPrimary, pressed && styles.pressed]}
              android_ripple={{ color: '#FFFFFF40' }}
              onPress={() => {
                const parent = navigation.getParent?.();
                if (parent?.navigate) {
                  parent.navigate('Leads' as never, { screen: 'LeadCreate' } as never);
                  return;
                }
                navigation.navigate('Leads' as never, { screen: 'LeadCreate' } as never);
              }}
            >
              <Ionicons name="add-circle" size={18} color="#0F172A" />
              <Text style={styles.ctaText}>Create Lead</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cta, styles.ctaGhost, pressed && styles.pressed]}
              android_ripple={{ color: '#FFFFFF20' }}
              onPress={() => console.log('View pipeline')}
            >
              <Ionicons name="podium-outline" size={18} color="#FFFFFF" />
              <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>View Pipeline</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Leads</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="people-outline" size={22} color="#0D1B2A" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>New Leads</Text>
              <Text style={styles.cardSubtitle}>12 awaiting contact</Text>
            </View>
            <Text style={styles.badge}>Hot: 3</Text>
          </View>
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => {
              const parent = navigation.getParent?.();
              if (parent?.navigate) {
                parent.navigate('Leads' as never);
                return;
              }
              navigation.navigate('Leads' as never);
            }}
          >
            <Text style={styles.actionText}>View all leads</Text>
            <Ionicons name="arrow-forward" size={18} color="#0D1B2A" />
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>To-do</Text>
        <View style={styles.card}>
          {todos.map((item) => (
            <View key={item} style={styles.todoRow}>
              <Ionicons name="checkbox-outline" size={18} color="#0D1B2A" />
              <Text style={styles.todoText}>{item}</Text>
            </View>
          ))}
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => console.log('Add todo')}
          >
            <Text style={styles.actionText}>Add to-do</Text>
            <Ionicons name="add" size={18} color="#0D1B2A" />
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Tasks</Text>
        <View style={styles.card}>
          {tasks.map((task) => (
            <View key={task.title} style={styles.taskRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSub}>{task.time}</Text>
              </View>
              <Text style={styles.badgeMuted}>{task.status}</Text>
            </View>
          ))}
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => console.log('View tasks')}
          >
            <Text style={styles.actionText}>View all tasks</Text>
            <Ionicons name="arrow-forward" size={18} color="#0D1B2A" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  body: { flexGrow: 1, padding: 16, gap: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  heroLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
  heroSub: { color: '#E2E8F0', fontSize: 13 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaPrimary: { backgroundColor: '#FFFFFF' },
  ctaGhost: { borderWidth: 1, borderColor: '#334155' },
  ctaText: { fontWeight: '800', color: '#0D1B2A', fontSize: 14 },
  pillsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  pillLabel: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  pillValue: { color: '#0F172A', fontWeight: '800', fontSize: 16, marginTop: 2 },
  pillBlue: { backgroundColor: '#DBEAFE' },
  pillRed: { backgroundColor: '#FEE2E2' },
  pillGreen: { backgroundColor: '#DCFCE7' },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  cardSubtitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  badge: {
    backgroundColor: '#E0F2FE',
    color: '#0D1B2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 12,
  },
  badgeMuted: {
    backgroundColor: '#E5E7EB',
    color: '#0D1B2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionText: { fontWeight: '700', color: '#0D1B2A', fontSize: 14 },
  pressed: { transform: [{ scale: 0.98 }] },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todoText: { fontSize: 14, color: '#0D1B2A' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#0D1B2A' },
  taskSub: { color: '#4B5563', fontSize: 12, marginTop: 2 },
});

export default CRMDashboard;
