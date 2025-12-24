import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
  Image,
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
  const headerEstimated = insets.top + 96; // header height including safe area
  const heroEstimated = 110; // greeting block
  const paddingEstimated = 32; // content padding & gaps
  const tabBarHeight = 88; // approximate bottom tabs height
  const availableGridHeight = screenHeight - headerEstimated - heroEstimated - paddingEstimated - tabBarHeight;
  const targetHeightFromScreen = (availableGridHeight - gap) / 2;
  const minCardHeight = Math.max(220, screenHeight * 0.28);
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
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('Notifications' as never);
      return;
    }
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        pillText="HRM"
        badgeCount={1}
        onBackPress={() => navigation.goBack?.()}
        onBellPress={handleNotificationPress}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />

      <View style={[styles.content, { minHeight: screenHeight - (insets.top + 40) }]}>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
    flexGrow: 1,
    flex: 1,
    justifyContent: 'flex-start',
  },
  hero: { marginBottom: 18 },
  heroHello: { fontSize: 32, fontWeight: '700', color: '#111827' },
  heroTitle: { fontSize: 22, fontWeight: '600', color: '#111827', marginTop: 6 },
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
    top: '42%',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    resizeMode: 'cover',
    overflow: 'hidden',
  },
});

export default HRMDashboard;
