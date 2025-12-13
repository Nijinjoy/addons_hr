import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const avatar = require('../../assets/images/logo/logo.png');

type ProfileScreenProps = {
  onBack?: () => void;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const profile = {
    name: 'Nijin Joy',
    role: 'Senior Engineer',
    email: 'nijin.joy@addon-s.com',
    phone: '+91 98765 43210',
    location: 'Kochi, India',
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#141D35', '#1D2B4C', '#14223E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image source={avatar} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color="#1D2B4C" />
            <Text style={styles.rowText}>{profile.email}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="call-outline" size={20} color="#1D2B4C" />
            <Text style={styles.rowText}>{profile.phone}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color="#1D2B4C" />
            <Text style={styles.rowText}>{profile.location}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color="#1D2B4C" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#1D2B4C" />
            <Text style={styles.actionText}>Account Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  safeHeader: {
    paddingHorizontal: 16,
  },
  container: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6EC6FF',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: '700', color: '#1D2B4C' },
  role: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2B4C',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  actionText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D2B4C',
  },
  logoutButton: {
    backgroundColor: '#FF4D4F',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
});

export default ProfileScreen;
