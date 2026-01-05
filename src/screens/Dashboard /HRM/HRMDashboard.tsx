import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logo } from '../../../assets/images';
import Header from '../../../components/Header';

const CARDS = [
  {
    key: 'attendance',
    label: 'Attendance',
    icon: <MaterialCommunityIcons name="account-check-outline" size={56} color="#0F172A" />,
    color: '#BFD9F8',
    route: 'Attendance',
  },
  {
    key: 'timesheet',
    label: 'Timesheet',
    icon: <MaterialCommunityIcons name="calendar-multiselect" size={56} color="#0F172A" />,
    color: '#07C08B',
    route: 'TimesheetScreen',
  },
  {
    key: 'tasks',
    label: 'Task',
    icon: <Ionicons name="checkbox-outline" size={56} color="#0F172A" />,
    color: '#3B91C8',
    route: 'TaskList',
  },
  {
    key: 'leaves',
    label: 'Leave Apply',
    icon: <MaterialCommunityIcons name="calendar-edit" size={56} color="#0F172A" />,
    color: '#BFD9F8',
    route: 'Leaves',
  },
] as const;

const HRMDashboard = () => {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Size cards for exactly 2 per row and healthy vertical fill
  const horizontalPadding = 20;
  const gap = 16;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gap) / 2;
  const headerEstimated = insets.top + 88; // header height including safe area
  const heroEstimated = 88; // greeting block
  const paddingEstimated = 28; // content padding & gaps
  const tabBarHeight = 88; // approximate bottom tabs height
  const availableGridHeight = screenHeight - headerEstimated - heroEstimated - paddingEstimated - tabBarHeight;
  const targetHeightFromScreen = (availableGridHeight - gap) / 2;
  const minCardHeight = Math.max(180, screenHeight * 0.22);
  const maxCardHeight = screenHeight * 0.55;
  const cardHeight = Math.max(minCardHeight, Math.min(targetHeightFromScreen, maxCardHeight));

  const handleNavigate = (route: string) => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate(route as never);
      return;
    }
    navigation.navigate(route as never);
  };

  const handleNotificationPress = useCallback(() => {
    const rootNav = (navigation as any)?.getParent?.()?.getParent?.();
    if (rootNav?.navigate) {
      rootNav.navigate('Notifications' as never);
      return;
    }
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Header
        pillText="HRM"
        showBackButton={false}
        badgeCount={5}
        onBellPress={handleNotificationPress}
        onProfilePress={() => (navigation as any)?.openDrawer?.()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={[styles.content, { minHeight: screenHeight - (insets.top + 40) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroHello}>Hello</Text>
            <Text style={styles.heroTitle}>Everything You Need Fast</Text>
          </View>

          <View style={styles.gridWrapper}>
            <View style={styles.grid}>
              {CARDS.map(({ key, label, icon, color, route }) => (
                <Pressable
                  key={key}
                  onPress={() => handleNavigate(route)}
                  android_ripple={{ color: '#CBD5E1' }}
                  style={({ pressed }) => [
                    styles.cardBase,
                    { backgroundColor: color, width: cardWidth, height: cardHeight },
                    pressed && styles.cardPressed,
                  ]}
                >
                  {icon}
                  <Text style={styles.cardLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.centerLogo}>
              <View style={styles.centerLogoCircle}>
                <Image source={logo} style={styles.centerLogoImage} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Calendar</Text>
            </View>
            <Pressable
              onPress={() => handleNavigate('Calendar')}
              android_ripple={{ color: '#E2E8F0' }}
              style={({ pressed }) => [
                styles.calendarCard,
                pressed && styles.calendarCardPressed,
              ]}
            >
              <View style={styles.calendarIconWrap}>
                <Ionicons name="calendar-outline" size={28} color="#1D3765" />
              </View>
              <View style={styles.calendarText}>
                <Text style={styles.calendarTitle}>Upcoming schedule</Text>
                <Text style={styles.calendarSub}>No events yet. Add items in calendar.</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141D35' },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    flexGrow: 1,
    flex: 1,
    justifyContent: 'flex-start',
  },
  hero: { marginBottom: 18 },
  heroHello: { fontSize: 26, fontWeight: '700', color: '#111827' },
  heroTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 6 },
  heroSub: { fontSize: 14, color: '#6B7280', marginTop: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    paddingBottom: 24,
  },
  gridWrapper: { position: 'relative' },
  cardBase: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  cardPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.04 },
  centerLogo: {
    position: 'absolute',
    alignSelf: 'center',
    top: '43%',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  centerLogoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  section: {
    marginTop: 8,
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  calendarCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarCardPressed: {
    opacity: 0.85,
  },
  calendarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarText: {
    flex: 1,
  },
  calendarTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  calendarSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#475569',
  },
});

export default HRMDashboard;
