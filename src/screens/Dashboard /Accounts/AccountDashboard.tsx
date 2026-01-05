import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getExpenseHistory } from '../../../services/expenseClaim';

const AccountDashboard = () => {
  const navigation = useNavigation();
  const [statusCounts, setStatusCounts] = useState({ draft: 0, approved: 0, rejected: 0 });
  const quickActions = [
    { icon: 'add-circle-outline', label: 'New expense', desc: 'Log a purchase in seconds' },
    { icon: 'time-outline', label: 'History', desc: 'View past expense claims' },
  ];
  const claims = [
    { label: 'Draft', value: statusCounts.draft, color: '#FFFFFF' },
    { label: 'Approved', value: statusCounts.approved, color: '#FFFFFF' },
    { label: 'Rejected', value: statusCounts.rejected, color: '#FFFFFF' },
  ];

  const handleNotificationPress = useCallback(() => {
    const rootNav = (navigation as any)?.getParent?.()?.getParent?.();
    if (rootNav?.navigate) {
      rootNav.navigate('Notifications' as never);
      return;
    }
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  useEffect(() => {
    let mounted = true;
    const loadDraftCount = async () => {
      const res = await getExpenseHistory({ limit: 200 });
      if (!mounted) return;
      if (!res.ok) {
        setStatusCounts({ draft: 0, approved: 0, rejected: 0 });
        return;
      }
      const nextCounts = (res.data || []).reduce(
        (acc, item) => {
          const status = String(item.status || '').toLowerCase();
          if (status === 'draft') acc.draft += 1;
          if (status === 'approved') acc.approved += 1;
          if (status === 'rejected') acc.rejected += 1;
          return acc;
        },
        { draft: 0, approved: 0, rejected: 0 }
      );
      setStatusCounts(nextCounts);
    };
    loadDraftCount();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header
        pillText="Accounts"
        badgeCount={0}
        onBellPress={handleNotificationPress}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Expense care</Text>
          <Text style={styles.heroTitle}>Get reimbursed faster with fewer clicks.</Text>
          <Text style={styles.heroSub}>
            Friendly workflows for receipts, claims, and finance approvals.
          </Text>
          <View style={styles.heroChips}>
            <View style={[styles.chip, styles.chipBlue]}>
              <Text style={styles.chipText}>Same-day uploads</Text>
            </View>
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={styles.chipText}>Policy friendly</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            {claims.map(item => (
              <View key={item.label} style={[styles.stat, { backgroundColor: item.color }]}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => navigation.getParent()?.navigate('Expense')}
          >
            <Text style={styles.primaryText}>Start a new claim</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map(action => (
            <Pressable
              key={action.label}
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
              onPress={() => {
                if (action.label === 'New expense') {
                  navigation.getParent()?.navigate('Expense');
                  return;
                }
                if (action.label === 'History') {
                  navigation.getParent()?.navigate('Expense', { initialTab: 'history' });
                  return;
                }
                console.log(action.label);
              }}
            >
              <Ionicons name={action.icon} size={20} color="#0F172A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{action.label}</Text>
                <Text style={styles.quickDesc}>{action.desc}</Text>
              </View>
              <View style={styles.quickArrow}>
                <Ionicons name="chevron-forward" size={18} color="#0F172A" />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { padding: 16, gap: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: '#D7DBE0',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  heroLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  heroSub: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  heroChips: { flexDirection: 'row', gap: 10, marginTop: 6 },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipBlue: { backgroundColor: '#63B3E6' },
  chipGreen: { backgroundColor: '#19C89B' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#6B7280' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  primaryButton: {
    backgroundColor: '#63B3E6',
    borderRadius: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  primaryText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  pressed: { opacity: 0.88 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#111827' },
  quickGrid: { gap: 10 },
  quickCard: {
    backgroundColor: '#D7DBE0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickTitle: { fontWeight: '700', color: '#111827', fontSize: 14 },
  quickDesc: { color: '#6B7280', fontSize: 12 },
  quickArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C2C8CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AccountDashboard;
