import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const METRICS = [15, 5, 5];
const LEAD_LINKS = ['New Leads', '30 Days', 'Last Year'];
const TODO_ITEMS = ['Call Leads', 'Tickets', 'Demo'];

const CRMDashboard = () => {
  const navigation = useNavigation();

  const go = useCallback(
    (route: string, params?: object) => {
      const parent = navigation.getParent?.();
      if (parent?.navigate) {
        parent.navigate(route as never, params as never);
        return;
      }
      navigation.navigate(route as never, params as never);
    },
    [navigation]
  );

  const goToLeads = useCallback(
    (screen?: string) => {
      if (screen) {
        go('Leads', { screen });
        return;
      }
      go('Leads');
    },
    [go]
  );

  const handleNotificationPress = useCallback(() => {
    navigation.getParent?.()?.getParent?.()?.navigate?.('Notifications' as never);
  }, [navigation]);
  const handleCreateLead = useCallback(() => goToLeads('LeadCreate'), [goToLeads]);
  const handleViewPipeline = useCallback(() => goToLeads(), [goToLeads]);
  const handleViewLeads = useCallback(() => goToLeads(), [goToLeads]);
  const handleProfile = useCallback(() => navigation.getParent()?.openDrawer?.(), [navigation]);
  const handleBack = useCallback(() => navigation.goBack?.(), [navigation]);

  return (
    <View style={styles.container}>
      <Header
        pillText="CRM"
        badgeCount={1}
        onBackPress={handleBack}
        onBellPress={handleNotificationPress}
        onProfilePress={handleProfile}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Grow relationships, faster.</Text>
          <Text style={styles.heroSub}>Stay on top of leads and ups</Text>
          <View style={styles.metricsRow}>
            {METRICS.map((num, idx) => (
              <View key={idx} style={styles.metric}>
                <Text style={styles.metricValue}>{num}</Text>
              </View>
            ))}
          </View>
          <View style={styles.heroActions}>
            <Pressable
              style={({ pressed }) => [styles.cta, styles.ctaBlue, pressed && styles.ctaPressed]}
              onPress={handleCreateLead}
              android_ripple={{ color: '#ffffff40' }}
            >
              <Text style={styles.ctaText}>Create Lead</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cta, styles.ctaGreen, pressed && styles.ctaPressed]}
              onPress={handleViewPipeline}
              android_ripple={{ color: '#ffffff30' }}
            >
              <Text style={styles.ctaText}>View Pipeline</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.duoRow}>
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardTitle}>Leads</Text>
            {LEAD_LINKS.map((text, idx) => (
              <Pressable
                key={idx}
                onPress={handleViewLeads}
                android_ripple={{ color: '#0f172a33' }}
              >
                <Text style={styles.cardLine}>{text}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={handleViewLeads}
              android_ripple={{ color: '#0f172a33' }}
              style={styles.cardLineRow}
            >
              <Text style={[styles.cardLine, styles.cardLineUnderline]}>View All Leads</Text>
              <Ionicons name="eye" size={16} color="#0F172A" />
            </Pressable>
          </View>

          <View style={[styles.card, styles.cardBlue]}>
            <Text style={styles.cardTitle}>To-DO</Text>
            {TODO_ITEMS.map((text, idx) => (
              <View key={idx} style={styles.todoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#0F172A" />
                <Text style={styles.cardLine}>{text}</Text>
              </View>
            ))}
            <View style={styles.cardLineRow}>
              <Text style={[styles.cardLine, styles.cardLineUnderline]}>Add To-Do</Text>
              <Ionicons name="add-circle" size={16} color="#0F172A" />
            </View>
          </View>
        </View>

        <View style={[styles.taskCard, styles.cardGray]}>
          <View>
            <Text style={styles.taskTitle}>Task</Text>
            <Text style={styles.taskSub}>Follow up with ACME</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>In Progress</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { padding: 16, gap: 18, paddingBottom: 28 },
  hero: {
    backgroundColor: '#D7DBE0',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  heroSub: { fontSize: 14, color: '#4B5563' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  metric: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cta: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBlue: { backgroundColor: '#4EA0CC' },
  ctaGreen: { backgroundColor: '#19C89B' },
  ctaPressed: { opacity: 0.9 },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  duoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    minHeight: 190,
  },
  cardGreen: { backgroundColor: '#19C89B' },
  cardBlue: { backgroundColor: '#4EA0CC' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  cardLine: { fontSize: 14, color: '#0F172A' },
  cardLineUnderline: { textDecorationLine: 'underline' },
  cardLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardGray: { backgroundColor: '#D7DBE0' },
  taskTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  taskSub: { color: '#4B5563', fontSize: 14, marginTop: 4 },
  statusPill: {
    backgroundColor: '#19C89B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: { color: '#0F172A', fontWeight: '700' },
});

export default CRMDashboard;
