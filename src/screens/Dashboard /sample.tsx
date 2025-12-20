import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Linking,
  PermissionsAndroid,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import {
  checkIn as checkInApi,
  checkOut as checkOutApi,
} from '../../services/api/attendance.service';
import { getAttendanceLogs } from '../../services/attendanceService';

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const statusStorageKey = 'attendance_status';
  const locationStorageKey = 'attendance_last_location';
  const coordsStorageKey = 'attendance_last_coords';
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastEvent, setLastEvent] = useState('No check-in recorded yet');
  const [loading, setLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState('Location not captured yet');
  const [lastCoords, setLastCoords] = useState('Coords not captured');
  const [history, setHistory] = useState<
    {
      id: string;
      date: string;
      checkIn?: string;
      checkOut?: string;
      totalHours?: string;
      location?: string;
    }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      const alreadyGrantedCoarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      if (alreadyGrantedFine || alreadyGrantedCoarse) return true;

      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

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
          resolve({ latitude, longitude });
        },
        (err: any) => {
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

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(statusStorageKey);
        const savedLocation = await AsyncStorage.getItem(locationStorageKey);
        const savedCoords = await AsyncStorage.getItem(coordsStorageKey);
        if (savedStatus) {
          const isIn = savedStatus === 'IN';
          setIsCheckedIn(isIn);
          setLastEvent(`Last status: ${isIn ? 'Checked In' : 'Checked Out'}`);
        }
        if (savedLocation) setLastLocation(savedLocation);
        if (savedCoords) setLastCoords(savedCoords);
      } catch (err) {
        console.log('Failed to load attendance status:', err);
      }
    };
    loadStatus();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const emp =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      if (!emp) {
        console.log('Attendance history skipped: no employee id');
        setHistory([]);
        return;
      }
      const res = await getAttendanceLogs(emp, 30);
      console.log('Attendance history response:', res);
      if (res.ok && res.data?.length) {
        const parsed = res.data.map((row) => {
          const rawDate = row.attendance_date || row.time;
          const dateObj = rawDate ? new Date(rawDate) : null;
          const date =
            dateObj && !Number.isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : rawDate || '—';
          const inTimeObj = row.in_time ? new Date(row.in_time) : dateObj;
          const outTimeObj = row.out_time ? new Date(row.out_time) : undefined;
          const formatTime = (d?: Date | null) =>
            d && !Number.isNaN(d.getTime())
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined;
          const timeStr = formatTime(inTimeObj) || (dateObj ? formatTime(dateObj) : undefined);
          const outStr = formatTime(outTimeObj);
          const location =
            row.device_id ||
            (row.latitude != null && row.longitude != null
              ? `${row.latitude.toFixed(5)},${row.longitude.toFixed(5)}`
              : '');
          return {
            id: row.name,
            date,
            checkIn: row.log_type === 'IN' || row.in_time ? timeStr : undefined,
            checkOut: row.log_type === 'OUT' || row.out_time ? outStr : undefined,
            totalHours: '',
            location,
            status: row.status,
          };
        });
        // Merge check-in/out by date
        const grouped: Record<string, any> = {};
        parsed.forEach((p) => {
          if (!grouped[p.date]) grouped[p.date] = { ...p };
          else grouped[p.date] = { ...grouped[p.date], ...p };
        });
        setHistory(Object.values(grouped));
      } else {
        setHistory([]);
      }
    } catch (err: any) {
      console.log('Attendance history fetch error:', err?.message || err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCheck = async (type: 'IN' | 'OUT') => {
    if (loading) return;
    try {
      setLoading(true);
      const emp =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      const companyUrl = (await AsyncStorage.getItem('company_url')) || undefined;
      if (!emp) {
        Alert.alert('Attendance', 'Employee id not found. Please log in again.');
        return;
      }

      const hasPerm = await requestLocationPermission();
      if (!hasPerm) {
        Alert.alert('Permission needed', 'Location permission is required to record attendance.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }

      const coords = await getLocation();
      if (coords.latitude == null || coords.longitude == null) {
        Alert.alert('Location error', 'Unable to fetch your location. Please try again with GPS on.');
        return;
      }

      const servicePayload = { companyUrl, employee: emp, coords };
      const res =
        type === 'IN'
          ? await checkInApi({
              ...servicePayload,
              logType: 'IN',
              // Let the service reverse-geocode and format location
            })
          : await checkOutApi({
              ...servicePayload,
              // Let the service reverse-geocode and format location
            });

      if (!res.ok) {
        Alert.alert('Attendance', res.message || `Failed to check ${type === 'IN' ? 'in' : 'out'}.`);
        return;
      }

      const resData: any = (res as any)?.data || {};
      const latFromRes = resData.latitude ?? resData.lat ?? resData?.location?.latitude;
      const lonFromRes = resData.longitude ?? resData.lon ?? resData?.location?.longitude;
      const finalLat = latFromRes ?? coords.latitude;
      const finalLon = lonFromRes ?? coords.longitude;
      const locationString =
        resData.location ||
        resData.mobile_id ||
        (finalLat != null && finalLon != null
          ? `${Number(finalLat).toFixed(6)},${Number(finalLon).toFixed(6)}`
          : undefined);

      const now = new Date();
      const dateLabel = now.toLocaleDateString();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(type === 'IN');
      setLastEvent(
        `${type === 'IN' ? 'Checked in' : 'Checked out'} at ${now.toLocaleString()}${
          locationString ? ' | Location recorded' : ''
        }`
      );
      setLastLocation(locationString || 'Location not captured');
      setLastCoords(
        finalLat != null && finalLon != null
          ? `Lat: ${Number(finalLat).toFixed(6)}, Lon: ${Number(finalLon).toFixed(6)}`
          : 'Coords not captured'
      );
      try {
        await AsyncStorage.multiSet([
          [statusStorageKey, type],
          [locationStorageKey, locationString || 'Location not captured'],
          [coordsStorageKey, finalLat != null && finalLon != null ? `${Number(finalLat).toFixed(6)},${Number(finalLon).toFixed(6)}` : ''],
        ]);
      } catch (errStore) {
        console.log('Failed to persist attendance status:', errStore);
      }
      setHistory((prev) => {
        const todayIndex = prev.findIndex((h) => h.date === dateLabel);
        if (todayIndex === -1) {
          const newEntry = {
            id: String(now.getTime()),
            date: dateLabel,
            checkIn: type === 'IN' ? timeLabel : undefined,
            checkOut: type === 'OUT' ? timeLabel : undefined,
            totalHours: type === 'OUT' ? '—' : undefined,
            location: locationString,
          };
          return [newEntry, ...prev];
        }
        const updated = [...prev];
        const existing = { ...updated[todayIndex] };
        if (type === 'IN') existing.checkIn = timeLabel;
        if (type === 'OUT') existing.checkOut = timeLabel;
        if (existing.checkIn && existing.checkOut) {
          const start = new Date(`${existing.date} ${existing.checkIn}`);
          const end = new Date(`${existing.date} ${existing.checkOut}`);
          const diffMs = end.getTime() - start.getTime();
          if (!Number.isNaN(diffMs) && diffMs > 0) {
            const hours = diffMs / (1000 * 60 * 60);
            existing.totalHours = `${hours.toFixed(2)} hrs`;
          }
        }
        existing.location = locationString || existing.location;
        updated[todayIndex] = existing;
        return updated;
      });
      Alert.alert('Attendance', `Successfully checked ${type === 'IN' ? 'in' : 'out'}.`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to record attendance';
      if (String(msg).toLowerCase().includes('location')) {
        Alert.alert('Location error', `${msg}. Please ensure GPS is on and allow location permission.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      Alert.alert('Attendance', msg);
    } finally {
      setLoading(false);
    }
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
          <View style={styles.statusTopRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{isCheckedIn ? 'ON SHIFT' : 'OFF SHIFT'}</Text>
            </View>
            <Text style={styles.statusSmall}>{loading ? 'Updating...' : 'Tap to toggle attendance'}</Text>
          </View>
          <View style={styles.statusMain}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Current status</Text>
              <Text style={styles.statusText}>{isCheckedIn ? 'Checked In' : 'Checked Out'}</Text>
              <Text style={styles.statusNote}>{lastEvent}</Text>
              <Text style={styles.locationLabel} numberOfLines={2}>
                {lastLocation}
              </Text>
              <Text style={styles.coordLabel}>{lastCoords}</Text>
            </View>
            <Pressable
              onPress={() => handleCheck(isCheckedIn ? 'OUT' : 'IN')}
              disabled={loading}
              android_ripple={{ color: '#FFFFFF20' }}
              style={({ pressed }) => [
                styles.primaryBtn,
                isCheckedIn ? styles.btnOut : styles.btnIn,
                (pressed || loading) && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Please wait...' : isCheckedIn ? 'Check Out' : 'Check In'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#E2E8F0" />
              <Text style={styles.metaText}>Shift: 9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#E2E8F0" />
              <Text style={styles.metaText} numberOfLines={1}>
                {lastLocation !== 'Location not captured yet' ? 'Location synced' : 'Awaiting GPS'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>History</Text>
        <View style={styles.historyBox}>
          {historyLoading ? (
            <Text style={styles.historyEmpty}>Loading history...</Text>
          ) : history.length === 0 ? (
            <Text style={styles.historyEmpty}>No attendance records yet.</Text>
          ) : (
            history.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.historyRowCard,
                  idx !== history.length - 1 && styles.historyDivider,
                ]}
              >
                <View style={styles.historyLeft}>
                  <Ionicons name="calendar-outline" size={18} color="#0F172A" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <View style={styles.historyTimesColumn}>
                      <View style={styles.historySimpleRow}>
                        <Text style={styles.historyTimeLabel}>In:</Text>
                        <Text style={styles.historyTimeValue}>{item.checkIn || '—'}</Text>
                      </View>
                  <View style={styles.historySimpleRow}>
                    <Text style={styles.historyTimeLabel}>Out:</Text>
                    <Text style={styles.historyTimeValue}>{item.checkOut || '—'}</Text>
                  </View>
                  {item.location ? (
                    <Text style={styles.historyLocation} numberOfLines={1}>
                      {item.location}
                    </Text>
                  ) : null}
                  {item.status ? (
                    <View style={styles.historyStatusBadge}>
                      <Text style={styles.historyStatusText}>{item.status}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyDuration}>{item.totalHours || '—'}</Text>
                </View>
              </View>
            ))
          )}
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
          <ActionCard
            icon={<Ionicons name="checkbox-outline" size={22} color="#0F172A" />}
            title="Tasks"
            subtitle="View your task list"
            onPress={() => navigation.navigate('TaskList' as never)}
            tint={styles.accentBlue}
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
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusLabel: { color: '#A5B4FC', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  statusText: { color: '#FFFFFF', fontWeight: '800', fontSize: 22, marginTop: 6 },
  statusNote: { color: '#E2E8F0', fontSize: 13, marginTop: 4 },
  statusSmall: { color: '#E2E8F0', fontSize: 12 },
  badge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: '#0F172A', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  locationLabel: { color: '#CBD5E1', marginTop: 6, fontSize: 12, lineHeight: 16 },
  coordLabel: { color: '#CBD5E1', marginTop: 2, fontSize: 11 },
  primaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIn: { backgroundColor: '#22C55E' },
  btnOut: { backgroundColor: '#F97316' },
  primaryBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
  btnPressed: { opacity: 0.85 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', marginTop: 4 },
  historyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  historyDate: { fontWeight: '800', color: '#0D1B2A', fontSize: 15 },
  historyTimesColumn: { marginTop: 6, gap: 4 },
  historySimpleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTimeLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  historyTimeValue: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  historyLocation: { color: '#475569', fontSize: 12, marginTop: 4 },
  historyStatusBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
  },
  historyStatusText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  historyRight: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 60 },
  historyDuration: { color: '#10B981', fontWeight: '800', fontSize: 14 },
  historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyEmpty: { textAlign: 'center', color: '#6B7280', paddingVertical: 12 },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#E2E8F0', fontSize: 12, maxWidth: 160 },
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
