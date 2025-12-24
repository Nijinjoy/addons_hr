import React, { useEffect, useMemo, useState ,useCallback} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import Header from '../../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import {
  checkIn as checkInApi,
  checkOut as checkOutApi,
} from '../../../services/api/attendance.service';
import { getAttendanceLogs } from '../../../services/attendanceService';

type HistoryEntry = {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: string;
  hoursValue?: number;
  status?: string;
  shift?: string;
  location?: string;
};

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const statusStorageKey = 'attendance_status';
  const locationStorageKey = 'attendance_last_location';
  const coordsStorageKey = 'attendance_last_coords';

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState('No check-in recorded yet');
  const [lastLocation, setLastLocation] = useState('Location not captured yet');
  const [lastCoords, setLastCoords] = useState('Coords not captured');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [lastCheckInLabel, setLastCheckInLabel] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const looksLikeCoords = (val?: string) =>
    typeof val === 'string' && /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(val);

  const reverseGeocodeLabel = async (coords?: { latitude?: number; longitude?: number }) => {
    if (!coords?.latitude && !coords?.longitude) return undefined;
    const { latitude, longitude } = coords;
    if (latitude == null || longitude == null) return undefined;
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        latitude
      )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data: any = await res.json();
      const parts = [data.city, data.locality, data.principalSubdivision, data.countryName]
        .map((p) => (p || '').trim())
        .filter(Boolean);
      const place = parts.join(', ');
      return place || data?.localityInfo?.informative?.[0]?.name || undefined;
    } catch (err) {
      console.log('reverseGeocodeLabel failed:', err);
      return undefined;
    }
  };

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

  useEffect(() => {
    loadStatus();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const emp =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      if (!emp) {
        setHistory([]);
        return;
      }
      const res = await getAttendanceLogs(emp, 30);
      console.log('Attendance history response:', res);
      let latestType: 'IN' | 'OUT' | undefined;
      let latestTimestamp: string | undefined;
      let latestLocationFromServer: string | undefined;
      let latestCheckInTime: string | undefined;

      if (res.ok && res.data?.length) {
        const parsed = res.data.map((row) => {
          const rawDate = row.attendance_date || row.time;
          const dateObj = rawDate ? new Date(rawDate) : null;
          const date =
            dateObj && !Number.isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : rawDate || '—';
          const inTimeObj = row.in_time ? new Date(row.in_time) : dateObj;
          const outTimeObj = row.out_time ? new Date(row.out_time) : undefined;
          const formatTime = (d?: Date | null) =>
            d && !Number.isNaN(d.getTime())
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined;
          const fallbackTime = dateObj ? formatTime(dateObj) : undefined;
          const timeStr = formatTime(inTimeObj) || fallbackTime;
          const outStr =
            row.log_type === 'OUT'
              ? formatTime(outTimeObj) || fallbackTime
              : formatTime(outTimeObj);
          const hoursValue =
            inTimeObj &&
            outTimeObj &&
            !Number.isNaN(inTimeObj.getTime()) &&
            !Number.isNaN(outTimeObj.getTime()) &&
            outTimeObj.getTime() > inTimeObj.getTime()
              ? (outTimeObj.getTime() - inTimeObj.getTime()) / (1000 * 60 * 60)
              : undefined;
          const totalHours = hoursValue != null ? `${hoursValue.toFixed(2)} hrs` : undefined;
          const statusLabel =
            row.status ||
            (row.log_type === 'IN' || row.in_time ? 'Present' : row.log_type === 'OUT' ? 'Present' : undefined);
          const shiftLabel = row.shift || row.shift_type || undefined;
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
            status: statusLabel,
            shift: shiftLabel,
            totalHours,
            hoursValue,
            location,
            timeMs: dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.getTime() : undefined,
          };
        });

        const latestRow = [...(res.data || [])]
          .map((row) => {
            const candidates = [row.out_time, row.in_time, row.time, row.attendance_date].filter(Boolean);
            const timeMs = candidates
              .map((t: any) => new Date(t).getTime())
              .find((ms) => !Number.isNaN(ms));
            return { row, timeMs: timeMs ?? 0 };
          })
          .sort((a, b) => b.timeMs - a.timeMs)[0]?.row;
        if (latestRow) {
          latestType =
            latestRow.log_type ||
            (latestRow.out_time ? 'OUT' : latestRow.in_time ? 'IN' : undefined);
          const latestTime =
            latestRow.out_time || latestRow.in_time || latestRow.time || latestRow.attendance_date;
          latestTimestamp =
            latestTime && !Number.isNaN(new Date(latestTime).getTime())
              ? new Date(latestTime).toLocaleString()
              : undefined;
          latestLocationFromServer =
            latestRow.device_id ||
            (latestRow.latitude != null && latestRow.longitude != null
              ? `${Number(latestRow.latitude).toFixed(5)},${Number(latestRow.longitude).toFixed(5)}`
              : undefined);
        }

        const latestCheckInRow = [...(res.data || [])]
          .map((row) => {
            const t = row.in_time || row.time || row.attendance_date;
            const ms = t ? new Date(t).getTime() : 0;
            return { row, ms };
          })
          .filter(
            (r) =>
              r.row?.log_type === 'IN' ||
              r.row?.in_time ||
              r.row?.time ||
              r.row?.attendance_date
          )
          .sort((a, b) => b.ms - a.ms)[0];
        if (latestCheckInRow?.ms) {
          const formatted = new Date(latestCheckInRow.ms).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          latestCheckInTime = formatted;
        }
        const byDate = new Map<
          string,
          HistoryEntry & { inMs?: number; outMs?: number; lastMs?: number }
        >();
        parsed
          .sort((a, b) => (a.timeMs || 0) - (b.timeMs || 0))
          .forEach((entry) => {
            const key = entry.date;
            const existing =
              byDate.get(key) ||
              ({
                id: entry.id || key,
                date: entry.date,
                status: entry.status,
                shift: entry.shift,
                location: entry.location,
                inMs: undefined,
                outMs: undefined,
                lastMs: entry.timeMs,
              } as HistoryEntry & { inMs?: number; outMs?: number; lastMs?: number });
            if (!existing.id) existing.id = entry.id || key;
            if (entry.status) existing.status = entry.status;
            if (entry.shift) existing.shift = entry.shift;
            if (entry.location) existing.location = entry.location;
            if (entry.checkIn) {
              if (existing.inMs == null || (entry.timeMs || 0) < (existing.inMs || 0)) {
                existing.checkIn = entry.checkIn;
                existing.inMs = entry.timeMs;
              }
            }
            if (entry.checkOut) {
              if (existing.outMs == null || (entry.timeMs || 0) > (existing.outMs || 0)) {
                existing.checkOut = entry.checkOut;
                existing.outMs = entry.timeMs;
              }
            }
            existing.lastMs = Math.max(existing.lastMs || 0, entry.timeMs || 0);
            byDate.set(key, existing);
          });
        const aggregated: HistoryEntry[] = Array.from(byDate.values()).map((item) => {
          if (item.inMs != null && item.outMs != null && item.outMs > item.inMs) {
            const hours = (item.outMs - item.inMs) / (1000 * 60 * 60);
            item.hoursValue = hours;
            item.totalHours = `${hours.toFixed(2)} hrs`;
          }
          return item;
        });
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const limited = aggregated
          .filter((p) => (p.lastMs || 0) >= sevenDaysAgo)
          .sort((a, b) => (b.lastMs || 0) - (a.lastMs || 0))
          .slice(0, 7)
          .map(({ inMs, outMs, lastMs, ...rest }) => rest);
        setHistory(limited);
        console.log('Attendance history parsed entries:', {
          parsedCount: parsed.length,
          aggregatedCount: aggregated.length,
          limited,
        });
      } else {
        setHistory([]);
      }

      if (latestType) {
        setIsCheckedIn(latestType === 'IN');
        setLastEvent(
          `Last status: ${latestType === 'IN' ? 'Checked in' : 'Checked out'}${
            latestTimestamp ? ` at ${latestTimestamp}` : ''
          }`
        );
        if (latestLocationFromServer) {
          setLastLocation(latestLocationFromServer);
          await AsyncStorage.setItem(locationStorageKey, latestLocationFromServer);
        }
        await AsyncStorage.setItem(statusStorageKey, latestType);
      }
      if (latestCheckInTime) {
        setLastCheckInLabel(`You clocked in at ${latestCheckInTime}`);
      }
    } catch (err: any) {
      console.log('Attendance history fetch error:', err?.message || err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [statusStorageKey, locationStorageKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const unsubscribe = (navigation as any)?.addListener?.('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefreshHistory = async () => {
    await fetchHistory();
  };

  const handleCheck = useCallback(
    async (type: 'IN' | 'OUT') => {
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
            })
          : await checkOutApi({
              ...servicePayload,
            });

      console.log(
        `Attendance ${type === 'IN' ? 'check-in' : 'check-out'} response:`,
        res
      );

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
      const displayLocation =
        (!looksLikeCoords(locationString) && locationString) ||
        (await reverseGeocodeLabel({ latitude: finalLat, longitude: finalLon })) ||
        locationString;

      const nowLabel = new Date().toLocaleString();
      setIsCheckedIn(type === 'IN');
      setLastEvent(
        `${type === 'IN' ? 'Checked in' : 'Checked out'} at ${nowLabel}${
          locationString ? ' | Location recorded' : ''
        }`
      );
      setLastLocation(displayLocation || 'Location not captured yet');
      setLastCoords(
        finalLat != null && finalLon != null
          ? `${finalLat.toFixed(6)},${finalLon.toFixed(6)}`
          : 'Coords not captured'
      );
      if (type === 'IN') {
        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastCheckInLabel(`You clocked in at ${timeLabel}`);
      }

      await AsyncStorage.setItem(statusStorageKey, type);
      if (displayLocation) await AsyncStorage.setItem(locationStorageKey, displayLocation);
      if (finalLat != null && finalLon != null)
        await AsyncStorage.setItem(coordsStorageKey, `${finalLat},${finalLon}`);

      fetchHistory();
      Alert.alert('Attendance', `You are ${type === 'IN' ? 'checked in' : 'checked out'}.`);
    } catch (err: any) {
      console.log('Attendance check error:', err?.message || err);
      Alert.alert('Attendance', err?.message || `Failed to check ${type === 'IN' ? 'in' : 'out'}.`);
    } finally {
      setLoading(false);
    }
    },
    [fetchHistory, loading]
  );

  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const stats = useMemo(() => {
    const days = history.length;
    const hoursTotal = history.reduce((acc, h) => acc + (h.hoursValue || 0), 0);
    return {
      hours: hoursTotal.toFixed(2),
      days: days.toString(),
      late: '0',
    };
  }, [history]);

  return (
    <View style={styles.container}>
      <Header
        pillText="Attendance"
        badgeCount={0}
        onBackPress={() => navigation.goBack()}
        onBellPress={() => navigation.navigate('Notifications' as never)}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.clockIconWrap}>
            <Ionicons name="time-outline" size={36} color="#0F172A" />
          </View>
          <Text style={styles.clockText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
          <View style={styles.locationRowTop}>
            <Ionicons name="location-outline" size={14} color="#0F172A" />
            <Text style={styles.locationTextTop} numberOfLines={2}>
              {lastLocation}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              isCheckedIn && styles.primaryButtonDanger,
              pressed && styles.primaryButtonPressed,
            ]}
            android_ripple={{ color: '#E5E7EB' }}
            onPress={() => handleCheck(isCheckedIn ? 'OUT' : 'IN')}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Please wait...' : isCheckedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </Pressable>
          {lastCheckInLabel ? <Text style={styles.clockedText}>{lastCheckInLabel}</Text> : null}
        </View>

        <Text style={styles.sectionHeading}>This Week</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.hours}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.days}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Recent History</Text>
        <View style={styles.historyCard}>
          {historyLoading ? (
            <View style={styles.historyRow}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.historyEmpty}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <Text style={styles.historyEmpty}>No attendance records yet.</Text>
          ) : (
            history.map((item) => {
              const statusText = item.status;
              const isAbsent = statusText?.toLowerCase() === 'absent';
              const statusStyle = isAbsent ? styles.historyStatusAbsent : styles.historyStatus;
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.historyCardItem, pressed && styles.historyCardItemPressed]}
                  android_ripple={{ color: '#E5E7EB' }}
                >
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyDateRow}>
                      <MaterialCommunityIcons name="calendar-blank" size={16} color="#0F172A" />
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    {statusText ? (
                      <View style={[styles.statusChip, isAbsent && styles.statusChipAbsent]}>
                        <Text style={statusStyle}>{statusText}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.historyInfoRow}>
                    <View style={styles.infoPill}>
                      <Ionicons name="briefcase-outline" size={14} color="#0F172A" />
                      <Text style={styles.pillText}>{item.shift || 'No shift'}</Text>
                    </View>
                    {item.totalHours ? (
                      <View style={styles.infoPill}>
                        <Ionicons name="timer-outline" size={14} color="#0F172A" />
                        <Text style={styles.pillText}>{item.totalHours}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeLabel}>In</Text>
                      <Text style={styles.timeValue}>{item.checkIn || '—'}</Text>
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeLabel}>Out</Text>
                      <Text style={styles.timeValue}>{item.checkOut || '—'}</Text>
                    </View>
                  </View>

                  {item.location ? (
                    <View style={styles.historyLocationRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.historyLocationText} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  clockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  clockText: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  dateText: { fontSize: 13, color: '#6B7280' },
  locationRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    alignSelf: 'center',
    paddingHorizontal: 12,
  },
  locationTextTop: {
    color: '#4B5563',
    fontSize: 13,
    maxWidth: '90%',
    textAlign: 'center',
    flexShrink: 1,
  },
  historyLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  historyLocationText: { color: '#6B7280', fontSize: 12, flex: 1 },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#1F1F2E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonDanger: { backgroundColor: '#DC2626' },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  clockedText: { marginTop: 8, color: '#1F2937', fontSize: 13, fontWeight: '600' },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyEmpty: { textAlign: 'center', color: '#6B7280', paddingVertical: 12 },
  historyCardItem: {
    marginHorizontal: 8,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardItemPressed: { opacity: 0.9 },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDate: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#16A34A20',
  },
  statusChipAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC262620',
  },
  historyStatus: { color: '#16A34A', fontWeight: '800', fontSize: 12 },
  historyStatusAbsent: { color: '#DC2626', fontWeight: '800', fontSize: 12 },
  historyInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillText: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  timeBlock: { flex: 1 },
  timeLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  timeValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 2 },
  timeDivider: { width: 1, height: 26, backgroundColor: '#1F2937', marginHorizontal: 10 },
  historyMeta: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  historyHours: { fontSize: 12, color: '#111827', marginTop: 2, fontWeight: '700' },
  historyLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  locationText: { color: '#4B5563', flex: 1, marginLeft: 6, fontSize: 12 },
});

export default AttendanceScreen;
