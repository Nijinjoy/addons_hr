import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastEvent, setLastEvent] = useState('No check-in recorded yet');

  const markedDates = useMemo(
    () => ({
      '2025-01-10': { marked: true, dotColor: '#10B981' },
      '2025-01-11': { marked: true, dotColor: '#10B981' },
      '2025-01-12': { marked: true, dotColor: '#F59E0B' },
    }),
    []
  );

  const history = [
    { id: '1', label: 'Check In', time: '9:30 AM', note: 'Office', status: 'ok' },
    { id: '2', label: 'Check Out', time: '6:15 PM', note: 'Office', status: 'ok' },
    { id: '3', label: 'Check In', time: '10:05 AM', note: 'Remote', status: 'ok' },
  ];

  const toggleCheck = () => {
    const nextState = !isCheckedIn;
    setIsCheckedIn(nextState);
    setLastEvent(nextState ? 'Checked in just now' : 'Checked out just now');
  };

  const ActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    tint,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress?: () => void;
    tint: any;
  }) => (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#CBD5E1' }}
      style={({ pressed }) => [styles.actionCard, tint, pressed && styles.pressed]}
    >
      <View style={styles.cardRow}>
        {icon}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#0F172A" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header
        screenName="Attendance"
        useGradient
        showBack
        notificationCount={0}
        navigation={navigation as any}
        onBackPress={() => {
          // Send user back to the HRM tab inside the main dashboard
          navigation.navigate('Dashboard' as never, {
            screen: 'DashboardTabs',
            params: { screen: 'HRM' },
          } as never);
        }}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusText}>{isCheckedIn ? 'Checked In' : 'Checked Out'}</Text>
            <Text style={styles.statusNote}>{lastEvent}</Text>
          </View>
          <Pressable
            onPress={toggleCheck}
            android_ripple={{ color: '#FFFFFF50' }}
            style={({ pressed }) => [
              styles.primaryBtn,
              isCheckedIn ? styles.btnOut : styles.btnIn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>{isCheckedIn ? 'Check Out' : 'Check In'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Calendar</Text>
        <View style={styles.calendarBox}>
          <Calendar
            markedDates={markedDates}
            theme={{
              todayTextColor: '#2563EB',
              selectedDayBackgroundColor: '#2563EB',
              textMonthFontWeight: '700',
              textDayFontSize: 15,
            }}
          />
        </View>

        <Text style={styles.sectionHeading}>History</Text>
        <View style={styles.historyBox}>
          {history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyIconWrap}>
                <MaterialCommunityIcons
                  name={item.label === 'Check In' ? 'login-variant' : 'logout-variant'}
                  size={18}
                  color="#0F172A"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{item.label}</Text>
                <Text style={styles.historySub}>{item.note}</Text>
              </View>
              <Text style={styles.historyTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Requests</Text>
        <View style={styles.actionsRow}>
          <ActionCard
            icon={<MaterialCommunityIcons name="calendar-plus" size={24} color="#0F172A" />}
            title="Request Attendance"
            subtitle="Submit corrections or manual logs"
            onPress={() => console.log('Request attendance')}
            tint={styles.accentBlue}
          />
          <ActionCard
            icon={<Ionicons name="briefcase-outline" size={22} color="#0F172A" />}
            title="Request a Shift"
            subtitle="Ask for a shift change"
            onPress={() => console.log('Request shift')}
            tint={styles.accentTeal}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  statusCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statusLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  statusText: { color: '#FFFFFF', fontWeight: '800', fontSize: 22, marginTop: 6 },
  statusNote: { color: '#E2E8F0', fontSize: 13, marginTop: 4 },
  primaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnIn: { backgroundColor: '#22C55E' },
  btnOut: { backgroundColor: '#F97316' },
  primaryBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
  btnPressed: { opacity: 0.85 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', marginTop: 4 },
  calendarBox: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  historyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: { fontWeight: '700', color: '#0D1B2A', fontSize: 15 },
  historySub: { color: '#4B5563', fontSize: 12, marginTop: 2 },
  historyTime: { color: '#0D1B2A', fontWeight: '700', fontSize: 13 },
  actionsRow: { gap: 12 },
  actionCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  cardSubtitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  accentBlue: { backgroundColor: '#E0F2FE', borderColor: '#BFDBFE' },
  accentTeal: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  pressed: { transform: [{ scale: 0.98 }] },
});

export default AttendanceScreen;
