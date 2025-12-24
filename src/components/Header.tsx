import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HeaderProps = {
  pillText?: string;
  badgeCount?: number;
  onBackPress?: () => void;
  onBellPress?: () => void;
  onProfilePress?: () => void;
};

const Header = ({
  pillText = 'HRM',
  badgeCount = 0,
  onBackPress,
  onBellPress,
  onProfilePress,
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('user_image')
      .then((val) => {
        if (mounted) setAvatarUrl(val || null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <LinearGradient
      colors={['#141D35', '#1D2B4C', '#14223E']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 6 }]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftActions}>
          <Pressable
            style={[styles.circle, styles.arrowCircle]}
            onPress={onBackPress}
            android_ripple={{ color: '#E5E7EB' }}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable style={styles.pill} onPress={onBackPress}>
            <Text style={styles.pillText}>{pillText}</Text>
          </Pressable>
        </View>

        <View style={styles.rightActions}>
          <Pressable
            style={[styles.circle, styles.bell]}
            onPress={onBellPress}
            android_ripple={{ color: '#1D8CD6' }}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.circle, styles.avatar]}
            onPress={onProfilePress}
            android_ripple={{ color: '#E5E7EB' }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={26} color="#6B7280" />
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    alignSelf: 'stretch',
    zIndex: 10,
    marginHorizontal: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 4,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  pillText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bell: { backgroundColor: '#1E90F0' },
  avatar: { backgroundColor: '#E5E7EB', width: 46, height: 46, borderRadius: 23 },
  avatarImage: { width: 46, height: 46, borderRadius: 23, resizeMode: 'cover' },
  arrowCircle: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default Header;
