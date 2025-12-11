import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface HeaderProps {
  screenName: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  notificationCount?: number;
  useGradient?: boolean; 
}

const Header: React.FC<HeaderProps> = ({ 
  screenName, 
  onNotificationPress, 
  onProfilePress,
  notificationCount = 0,
  useGradient = true 
}) => {
  if (useGradient) {
    return (
      <View style={{ flex: 0 }}>
        <LinearGradient 
          colors={["#141D35", "#1D2B4C", "#14223E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#141D35" />
            <View style={styles.container}>
              <View style={styles.leftSection}>
                <Text style={styles.screenName}>{screenName}</Text>
              </View>
              <View style={styles.rightSection}>
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={onNotificationPress}
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
                  style={styles.iconButton} 
                  onPress={onProfilePress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  safeAreaSolid: {
    backgroundColor: '#141D35',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  containerSolid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141D35',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftSection: {
    flex: 1,
  },
  screenName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Header;