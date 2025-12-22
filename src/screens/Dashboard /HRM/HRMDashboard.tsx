import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ACTIONS = [
  {
    key: 'attendance',
    label: 'Attendance',
    sub: 'Log & review presence',
    icon: <MaterialCommunityIcons name="calendar-check" size={26} color="#0D1B2A" />,
    route: 'Attendance',
    style: 'accentBlue',
  },
  {
    key: 'timesheet',
    label: 'Timesheet',
    sub: 'Capture today’s work',
    icon: <Ionicons name="time-outline" size={24} color="#0D1B2A" />,
    route: 'TimesheetScreen',
    style: 'accentTeal',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    sub: 'My list & team board',
    icon: <Ionicons name="checkbox-outline" size={24} color="#0D1B2A" />,
    route: 'TaskList',
    style: 'accentOrange',
  },
  {
    key: 'leaves',
    label: 'Leaves',
    sub: 'Balance & apply',
    icon: <Ionicons name="leaf-outline" size={24} color="#0D1B2A" />,
    route: 'Leaves',
    style: 'accentGreen',
  },
] as const;

const HRMDashboard = () => {
  const navigation = useNavigation();
  const handleNavigate = (route: string) => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate(route as never);
      return;
    }
    navigation.navigate(route as never);
  };

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
        screenName="HRM"
        useGradient
        notificationCount={0}
        navigation={navigation as any}
        onNotificationPress={handleNotificationPress}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>HR Hub</Text>
          <Text style={styles.heroTitle}>Everything you need, fast.</Text>
          <Text style={styles.heroSub}>Tap a card to continue</Text>
        </View>

        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.grid}>
          {ACTIONS.map(({ key, label, sub, icon, route, style }) => (
            <Pressable
              key={key}
              onPress={() => handleNavigate(route)}
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [
                styles.card,
                styles[style],
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardIconText}>
                {icon}
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{label}</Text>
                  <Text style={styles.cardSubtitle}>{sub}</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#0D1B2A" />
            </Pressable>
          ))}
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { padding: 16, gap: 20, flexGrow: 1, paddingBottom: 40 },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
  },
  heroLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20, marginTop: 6 },
  heroSub: { color: '#E2E8F0', fontSize: 13, marginTop: 4 },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 8,
  },
  grid: { gap: 14, flexGrow: 1, justifyContent: 'space-evenly' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 110,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.02,
  },
  cardIconText: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  cardSubtitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  accentBlue: { backgroundColor: '#E0F2FE', borderColor: '#BFDBFE' },
  accentTeal: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  accentOrange: { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' },
  accentGreen: { backgroundColor: '#ECFDF3', borderColor: '#D1FADF' },
  spacer: { flex: 1 },
});

export default HRMDashboard;
