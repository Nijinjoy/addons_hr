import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AccountDashboard = () => {
  const navigation = useNavigation();

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
          <Text style={styles.heroLabel}>Accounts Hub</Text>
          <Text style={styles.heroTitle}>Track expenses, upload receipts.</Text>
          <Text style={styles.heroSub}>Everything you need to get reimbursed faster.</Text>
          <View style={styles.heroStats}>
            <View style={[styles.stat, styles.pillBlue]}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>4</Text>
            </View>
            <View style={[styles.stat, styles.pillGreen]}>
              <Text style={styles.statLabel}>Approved</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={[styles.stat, styles.pillOrange]}>
              <Text style={styles.statLabel}>Uploads</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Expenses</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="wallet-outline" size={22} color="#0D1B2A" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Recent Expenses</Text>
              <Text style={styles.cardSubtitle}>Submit and track reimbursements</Text>
            </View>
            <Text style={styles.badge}>4 pending</Text>
          </View>
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => console.log('View expenses')}
          >
            <Text style={styles.actionText}>View expenses</Text>
            <Ionicons name="arrow-forward" size={18} color="#0D1B2A" />
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Receipt Upload</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="cloud-upload-outline" size={22} color="#0D1B2A" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Upload receipts</Text>
              <Text style={styles.cardSubtitle}>Snap a photo or pick from gallery</Text>
            </View>
          </View>
          <View style={styles.uploadOptions}>
            <Pressable
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [styles.uploadButton, styles.pillBlue, pressed && styles.pressed]}
              onPress={() => console.log('Take photo')}
            >
              <Ionicons name="camera-outline" size={18} color="#0D1B2A" />
              <Text style={styles.uploadText}>Take photo</Text>
            </Pressable>
            <Pressable
              android_ripple={{ color: '#CBD5E1' }}
              style={({ pressed }) => [styles.uploadButton, styles.pillGreen, pressed && styles.pressed]}
              onPress={() => console.log('Pick from gallery')}
            >
              <Ionicons name="images-outline" size={18} color="#0D1B2A" />
              <Text style={styles.uploadText}>Pick from gallery</Text>
            </Pressable>
          </View>
          <Pressable
            android_ripple={{ color: '#CBD5E1' }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => console.log('Upload receipt')}
          >
            <Text style={styles.actionText}>Upload now</Text>
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  heroLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
  heroSub: { color: '#E2E8F0', fontSize: 13 },
  heroStats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { color: '#0D1B2A', fontWeight: '700', fontSize: 12 },
  statValue: { color: '#0D1B2A', fontWeight: '800', fontSize: 16, marginTop: 2 },
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
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionText: { fontWeight: '700', color: '#0D1B2A', fontSize: 14 },
  pressed: { transform: [{ scale: 0.98 }] },
  uploadOptions: { flexDirection: 'row', gap: 10 },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadText: { fontWeight: '700', color: '#0D1B2A' },
  pillBlue: { backgroundColor: '#DBEAFE' },
  pillGreen: { backgroundColor: '#DCFCE7' },
  pillOrange: { backgroundColor: '#FFE4E6' },
});

export default AccountDashboard;
