import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileDetails } from '../services/profileService';
import { ERP_URL_RESOURCE as ENV_URL_RESOURCE } from '../config/env';

interface HeaderProps {
  screenName: string;
  navigation?: DrawerNavigationProp<any>;
  notificationCount?: number;
  useGradient?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  screenName,
  navigation,
  notificationCount = 0,
  useGradient = true,
  showBack = false,
  onBackPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const normalizeAvatar = (uri?: string | null) => {
    if (!uri) return null;
    let cleaned = uri.trim();
    if (!cleaned) return null;
    // prefix base if relative
    if (cleaned.startsWith('/')) {
      const base = (ENV_URL_RESOURCE || '').replace(/\/api\/resource\/?$/, '').replace(/\/$/, '');
      cleaned = base ? `${base}${cleaned}` : cleaned;
    }
    // encode spaces
    if (cleaned.includes(' ')) {
      const parts = cleaned.split(' ');
      cleaned = parts.map((p) => encodeURIComponent(p)).join('%20');
    }
    return cleaned;
  };

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem('user_image');
        const cached = normalizeAvatar(cachedRaw);
        if (cached) {
          setAvatar(cached);
          return;
        }
      } catch {
        // ignore cache errors
      }

      try {
        const res = await getProfileDetails();
        if (res.ok && res.data?.image) {
          const normalized = normalizeAvatar(res.data.image);
          if (normalized) setAvatar(normalized);
          try {
            await AsyncStorage.setItem('user_image', normalized || res.data.image);
          } catch {
            // ignore cache write
          }
        }
      } catch {
        // ignore fetch errors
      }
    };
    loadAvatar();
  }, []);

  return (
    <LinearGradient
      colors={["#141D35", "#1D2B4C", "#14223E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <SafeAreaView edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#141D35" />
        <View style={styles.container}>
          <View style={styles.leftSection}>
            {showBack ? (
              <TouchableOpacity
                onPress={onBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.screenName}>{screenName}</Text>
          </View>

          <View style={styles.rightSection}>
            {/* Notification Icon */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress || (() => console.log('Notifications pressed'))}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile Icon */}
            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 16 }]} // space between notification and profile
              onPress={
                onProfilePress ||
                (navigation
                  ? () => navigation.openDrawer()
                  : () => console.log('Profile pressed'))
              }
              activeOpacity={0.7}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  leftSection: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 8 },
  screenName: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 4 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default Header;
