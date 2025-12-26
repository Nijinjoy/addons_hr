import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  PermissionsAndroid,
  Linking,
  NativeModules,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn } from '../../../services/attendanceService';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [lastCheckInText] = useState('Welcome back!');
  const [lastLocation] = useState<{ latitude?: number; longitude?: number }>({});

  const handleNotificationPress = useCallback(() => {
    const rootNav = (navigation as any)?.getParent?.()?.getParent?.();
    if (rootNav?.navigate) {
      rootNav.navigate('Notifications' as never);
      return;
    }
    (navigation as any)?.navigate?.('Notifications' as never);
  }, [navigation]);
  const requestLocationPermission = async (): Promise<boolean> => {
    const hasNativeGeo = !!(NativeModules as any)?.RNCGeolocation;

    if (Platform.OS !== 'android') {
      if (!hasNativeGeo) {
        Alert.alert(
          'Location unavailable',
          'Geolocation is not linked in this iOS build. Please run pod install and rebuild.'
        );
        return false;
      }
      try {
        const res = await Geolocation.requestAuthorization?.('whenInUse');
        if (res && typeof res === 'string') return res !== 'denied' && res !== 'restricted';
      } catch {
        // ignore and let the system handle
      }
      return true;
    }

    try {
      const alreadyGrantedFine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const alreadyGrantedCoarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      if (alreadyGrantedFine || alreadyGrantedCoarse) return true;

      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      return fineGranted || coarseGranted;
    } catch (err) {
      console.log('requestLocationPermission error:', err);
      return false;
    }
  };

  const getLocation = (): Promise<{ latitude?: number; longitude?: number }> =>
    new Promise((resolve, reject) => {
      const hasNativeGeo = !!(NativeModules as any)?.RNCGeolocation;
      const geo = Geolocation as any;
      if (!hasNativeGeo || !geo?.getCurrentPosition) {
        reject(
          new Error(
            'Geolocation module missing. Please install pods and rebuild the iOS app to enable location.'
          )
        );
        return;
      }
      geo.getCurrentPosition(
        (pos: any) => {
          const { latitude, longitude } = pos?.coords || {};
          console.log('Got location:', latitude, longitude);
          resolve({ latitude, longitude });
        },
        (err: any) => {
          console.log('getCurrentPosition error:', err);
          const message =
            err?.message ||
            (err?.code === 1
              ? 'Location permission denied'
              : err?.code === 2
              ? 'Location unavailable. Please turn on GPS.'
              : 'Unable to fetch your location');
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
      );
    });

  const handleCheckIn = async () => {
    Alert.alert('Attendance', 'Check-in is available from the Attendance tab.');
  };

  // Quick links data
  const quickLinks = [
    { 
      id: 1, 
      title: 'Request Attendance', 
      icon: 'event-note',
      iconType: 'material',
      screen: 'AttendanceRequest'
    },
    { 
      id: 2, 
      title: 'Request a Shift', 
      icon: 'schedule',
      iconType: 'material',
      screen: 'ShiftRequest'
    },
    { 
      id: 3, 
      title: 'Request Leave', 
      icon: 'beach-access',
      iconType: 'material',
      screen: 'LeaveRequest'
    },
    { 
      id: 4, 
      title: 'Claim an Expense', 
      icon: 'receipt',
      iconType: 'material',
      screen: 'ExpenseClaim'
    },
    { 
      id: 5, 
      title: 'Request an Advance', 
      icon: 'attach-money',
      iconType: 'material',
      screen: 'AdvanceRequest'
    },
    { 
      id: 6, 
      title: 'View Salary Slips', 
      icon: 'description',
      iconType: 'material',
      screen: 'SalarySlips'
    },
  ];

  const renderIcon = (iconType: string, iconName: string, size: number = 24, color: string = '#2E8B57') => {
    if (iconType === 'material-community' && MaterialCommunityIcons) {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    }
    return <Icon name={iconName} size={size} color={color} />;
  };

  const handleQuickLinkPress = (screen: string) => {
    console.log(`Navigating to ${screen}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="white" 
        translucent={false}
      />
      <Header
        pillText="Home"
        showBackButton={false}
        badgeCount={5}
        onBellPress={handleNotificationPress}
        onProfilePress={() => (navigation as any)?.openDrawer?.()}
      />
      <View style={styles.whiteContainer}>
        <ScrollView 
          style={[
            styles.scrollView,
            {
              marginBottom: insets.bottom,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 16,
            }
          ]}
        >
          <View style={styles.welcomeSection}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Welcome back</Text>
              <Text style={styles.heroSubtitle}>Quick actions to get you started.</Text>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => navigation.navigate('Attendance' as never)}
              >
                <Text style={styles.heroButtonText}>Open Attendance</Text>
                <Icon name="chevron-right" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Links Section */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={styles.quickLinksGrid}>
              {quickLinks.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.quickLinkCard}
                  onPress={() => handleQuickLinkPress(item.screen)}
                >
                  <View style={styles.quickLinkIcon}>
                    {renderIcon(item.iconType, item.icon)}
                  </View>
                  <Text style={styles.quickLinkText}>{item.title}</Text>
                  <Icon name="chevron-right" size={20} color="#999" style={styles.chevronIcon} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional content space */}
          <View style={styles.additionalContent}>
            <Text style={styles.additionalTitle}>Recent Activities</Text>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>No recent activities</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    // backgroundColor: 'white',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 16,
    backgroundColor: 'white',
    flexGrow: 1,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 22 },
  heroSubtitle: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  heroButtonText: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  quickLinksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickLinksGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  chevronIcon: {
    opacity: 0.7,
  },
  additionalContent: {
    marginBottom: 24,
  },
  additionalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  placeholderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});

export default HomeScreen;
