import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getProfile } from '../services/api/profile.service';

type HeaderProps = {
  title?: string;
  screenName?: string;
  pillText?: string;
  showBackButton?: boolean;
  showBack?: boolean;
  badgeCount?: number;
  onBackPress?: () => void;
  onBellPress?: () => void;
  onProfilePress?: () => void;
};

const Header = ({
  title,
  screenName,
  pillText,
  showBackButton,
  showBack,
  badgeCount = 0,
  onBackPress,
  onBellPress,
  onProfilePress,
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const showBackAction = (showBackButton ?? showBack) && !!onBackPress;
  const headerTitle = title || screenName || '';
  const showBell = !!onBellPress || badgeCount > 0;
  const showProfile = !!onProfilePress;
  const iconColor = '#FFFFFF';
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (!showProfile || profileImage) return;
    let isActive = true;
    const loadProfileImage = async () => {
      try {
        const res = await getProfile();
        if (!isActive) return;
        if (res.ok && res.data?.image) {
          setProfileImage(res.data.image);
        }
      } catch {
        // ignore profile load errors
      }
    };
    loadProfileImage();
    return () => {
      isActive = false;
    };
  }, [showProfile, profileImage]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, minHeight: insets.top + 56 }]}>
      <View style={styles.row}>
        <View style={[styles.leftSlot, !showBackAction && styles.leftSlotHidden]}>
          {showBackAction ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={iconColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.centerSlot}>
          {pillText ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{pillText}</Text>
            </View>
          ) : (
            <Text style={styles.title} numberOfLines={1}>
              {headerTitle || 'Dashboard'}
            </Text>
          )}
        </View>

        <View style={styles.rightSlot}>
          {showBell ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBellPress}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={iconColor} />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconSpacer} />
          )}
          {showProfile ? (
            <TouchableOpacity
              style={[styles.iconButton, styles.profileButton]}
              onPress={onProfilePress}
              accessibilityLabel="Profile"
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={24} color={iconColor} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141D35',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#0B1226',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  leftSlot: {
    width: 56,
    alignItems: 'flex-start',
  },
  leftSlotHidden: {
    width: 0,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSlot: {
    width: 112,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 6 : 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5F0FF',
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconSpacer: {
    width: 36,
    height: 36,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Header;
