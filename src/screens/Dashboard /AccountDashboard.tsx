import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AccountDashboard = () => {
  const navigation = useNavigation();
  const quickActions = [
    { icon: 'add-circle-outline', label: 'New expense', desc: 'Log a purchase in seconds' },
    { icon: 'cloud-upload-outline', label: 'Upload receipt', desc: 'Snap or attach a file' },
    { icon: 'car-outline', label: 'Mileage claim', desc: 'Add distance based claims' },
    { icon: 'document-text-outline', label: 'Export report', desc: 'Download monthly summary' },
  ];
  const claims = [
    { label: 'Under review', value: 2, color: '#F9A8D4' },
    { label: 'Approved', value: 9, color: '#A7F3D0' },
    { label: 'Paid out', value: 6, color: '#BFDBFE' },
  ];
  const timeline = [
    { label: 'Submitted', status: 'Aug 11', icon: 'checkmark-circle-outline' },
    { label: 'Manager review', status: 'In progress', icon: 'hourglass-outline' },
    { label: 'Finance review', status: 'Queued', icon: 'time-outline' },
    { label: 'Payout', status: 'ETA Aug 18', icon: 'card-outline' },
  ];

  return (
    <View style={styles.container}>
      <Header
        screenName="Accounts"
        useGradient
        navigation={navigation as any}
        notificationCount={0}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroHaloOne} />
          <View style={styles.heroHaloTwo} />
          <Text style={styles.heroLabel}>Expense care</Text>
          <Text style={styles.heroTitle}>Get reimbursed faster with fewer clicks.</Text>
          <Text style={styles.heroSub}>
            Friendly workflows for receipts, claims, and finance approvals.
          </Text>
          <View style={styles.heroChips}>
            <View style={[styles.chip, styles.chipSoft]}>
              <Ionicons name="sparkles" size={14} color="#0F172A" />
              <Text style={styles.chipText}>Same-day uploads</Text>
            </View>
            <View style={[styles.chip, styles.chipSoft]}>
              <Ionicons name="shield-checkmark" size={14} color="#0F172A" />
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
            <Ionicons name="flash-outline" size={18} color="#0F172A" />
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
              onPress={() => console.log(action.label)}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name={action.icon} size={18} color="#0F172A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{action.label}</Text>
                <Text style={styles.quickDesc}>{action.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Status at a glance</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="wallet-outline" size={22} color="#0F172A" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Reimbursement tracker</Text>
              <Text style={styles.cardSubtitle}>Stay ahead of payouts and policy checks</Text>
            </View>
            <Text style={styles.badge}>4 pending</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressLabel}>
              <Ionicons name="walk-outline" size={16} color="#0F172A" />
              <Text style={styles.progressText}>Week-to-date</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '64%' }]} />
            </View>
            <Text style={styles.progressValue}>64%</Text>
          </View>
          <View style={styles.timeline}>
            {timeline.map(item => (
              <View key={item.label} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name={item.icon} size={14} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                  <Text style={styles.timelineStatus}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Receipt upload</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="cloud-upload-outline" size={22} color="#0F172A" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Friendly upload flow</Text>
              <Text style={styles.cardSubtitle}>Less tapping, clearer guidance for clean receipts</Text>
            </View>
          </View>
          <View style={styles.uploadOptions}>
            <Pressable
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [styles.uploadButton, styles.pillBlue, pressed && styles.pressed]}
              onPress={() => console.log('Take photo')}
            >
              <Ionicons name="camera-outline" size={18} color="#0F172A" />
              <Text style={styles.uploadText}>Take photo</Text>
            </Pressable>
            <Pressable
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [styles.uploadButton, styles.pillGreen, pressed && styles.pressed]}
              onPress={() => console.log('Pick from gallery')}
            >
              <Ionicons name="images-outline" size={18} color="#0F172A" />
              <Text style={styles.uploadText}>Pick from gallery</Text>
            </Pressable>
          </View>
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => console.log('Upload receipt')}
          >
            <Text style={styles.actionText}>Upload now</Text>
            <Ionicons name="arrow-forward" size={18} color="#0F172A" />
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Helpful shortcuts</Text>
        <View style={styles.shortcutRow}>
          <View style={styles.shortcutCard}>
            <View style={styles.shortcutBadge}>
              <Ionicons name="book-outline" size={14} color="#0F172A" />
              <Text style={styles.shortcutBadgeText}>Guides</Text>
            </View>
            <Text style={styles.shortcutTitle}>Expense do&apos;s & don&apos;ts</Text>
            <Text style={styles.shortcutText}>Get tips on what finance needs for faster approvals.</Text>
          </View>
          <View style={styles.shortcutCard}>
            <View style={styles.shortcutBadge}>
              <Ionicons name="chatbubbles-outline" size={14} color="#0F172A" />
              <Text style={styles.shortcutBadgeText}>Help</Text>
            </View>
            <Text style={styles.shortcutTitle}>Talk to finance</Text>
            <Text style={styles.shortcutText}>Drop a note with your request ID and get support.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  body: { flexGrow: 1, padding: 16, gap: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  heroHaloOne: {
    position: 'absolute',
    right: -60,
    top: -50,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    opacity: 0.15,
  },
  heroHaloTwo: {
    position: 'absolute',
    right: 40,
    top: -10,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: '#A5B4FC',
    opacity: 0.25,
  },
  heroLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 22 },
  heroSub: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
  heroChips: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipSoft: { backgroundColor: '#E0F2FE' },
  chipText: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  heroStats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statLabel: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  statValue: { color: '#0F172A', fontWeight: '800', fontSize: 18, marginTop: 4 },
  primaryButton: {
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
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
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cardSubtitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  badge: {
    backgroundColor: '#E0F2FE',
    color: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '800',
    fontSize: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  actionText: { fontWeight: '800', color: '#0F172A', fontSize: 14 },
  pressed: { transform: [{ scale: 0.98 }] },
  quickGrid: { gap: 10 },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontWeight: '800', color: '#0F172A', fontSize: 14 },
  quickDesc: { color: '#475569', fontSize: 12 },
  progressRow: { gap: 8 },
  progressLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressText: { fontWeight: '700', color: '#0F172A' },
  progressBar: {
    backgroundColor: '#E2E8F0',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#34D399',
    height: 10,
    borderRadius: 999,
  },
  progressValue: { fontWeight: '700', color: '#0F172A', alignSelf: 'flex-end' },
  timeline: { gap: 10 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: { fontWeight: '800', color: '#0F172A', fontSize: 13 },
  timelineStatus: { color: '#475569', fontSize: 12 },
  uploadOptions: { flexDirection: 'row', gap: 10 },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadText: { fontWeight: '800', color: '#0F172A' },
  pillBlue: { backgroundColor: '#DBEAFE' },
  pillGreen: { backgroundColor: '#DCFCE7' },
  pillOrange: { backgroundColor: '#FFE4E6' },
  shortcutRow: { flexDirection: 'row', gap: 10 },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  shortcutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shortcutBadgeText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  shortcutTitle: { color: '#F8FAFC', fontWeight: '800', fontSize: 15 },
  shortcutText: { color: '#E2E8F0', fontSize: 12, lineHeight: 17 },
});

export default AccountDashboard;
