import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { DrawerNavigationProp } from '@react-navigation/drawer';

interface HeaderProps {
  screenName: string;
  navigation?: DrawerNavigationProp<any>;
  notificationCount?: number;
  useGradient?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  screenName,
  navigation,
  notificationCount = 0,
  useGradient = true,
  showBack = false,
  onBackPress,
}) => {
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
            {navigation ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => console.log('Notifications pressed')}
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
            ) : null}

            {/* Profile Icon */}
            {navigation ? (
              <TouchableOpacity
                style={[styles.iconButton, { marginLeft: 16 }]} // space between notification and profile
                onPress={() => navigation.openDrawer()}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
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
