import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, Alert, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { profile as profileImage } from '../../assets/images';
import { logout } from '../../services/authService';
import { deleteProfileImage, getProfileDetails, ProfileData, uploadProfileImage } from '../../services/profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

type ProfileScreenProps = {
  onBack?: () => void;
};

type DetailKey = 'Employee Details' | 'Company Information' | 'Contact Information' | 'Salary Information';
type DetailItem = { label: string; value: string };

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const navigation = useNavigation<any>();
  const [selectedSection, setSelectedSection] = useState<DetailKey | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storedAvatar, setStoredAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const initialLetter = useMemo(() => {
    if (profile?.initial) return profile.initial;
    const name = profile?.fullName || '';
    return name.trim() ? name.trim().charAt(0).toUpperCase() : '';
  }, [profile?.initial, profile?.fullName]);

  const quickLinks: { label: DetailKey; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Employee Details', icon: 'person-outline' as const },
    { label: 'Company Information', icon: 'briefcase-outline' as const },
    { label: 'Contact Information', icon: 'document-text-outline' as const },
    { label: 'Salary Information', icon: 'cash-outline' as const },
  ];

  const detailMap = useMemo(
    () =>
      ({
        'Employee Details': [
          { label: 'Full Name', value: profile?.fullName || '—' },
          { label: 'Employee Number', value: profile?.employeeId || '—' },
          { label: 'Designation', value: profile?.designation || '—' },
          { label: 'Department', value: profile?.department || '—' },
          { label: 'Company', value: profile?.company || '—' },
        ],
        'Company Information': [
          { label: 'Company', value: profile?.company || '—' },
          { label: 'Department', value: profile?.department || '—' },
          { label: 'Designation', value: profile?.designation || '—' },
        ],
        'Contact Information': [
          { label: 'Email', value: profile?.email || '—' },
          { label: 'Phone', value: profile?.phone || '—' },
          { label: 'User ID', value: profile?.userId || '—' },
        ],
        'Salary Information': [
          { label: 'Bank Name', value: '—' },
          { label: 'Account Number', value: '—' },
          { label: 'IFSC Code', value: '—' },
          { label: 'Salary Cycle', value: '—' },
        ],
      }) as Record<DetailKey, DetailItem[]>,
    [profile]
  );

  const handleOpenSection = (section: DetailKey) => {
    setSelectedSection(section);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedSection(null);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Close drawer if open and reset to Auth stack
            const drawerNav: any = navigation.getParent?.();
            try {
              drawerNav?.closeDrawer?.();
            } catch {
              // ignore
            }
            const rootNav: any = drawerNav?.getParent?.() || navigation.getParent?.();
            if (rootNav?.reset) {
              rootNav.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            } else {
              navigation.reset?.({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        try {
          const cachedImage = await AsyncStorage.getItem('user_image');
          if (cachedImage) setStoredAvatar(cachedImage);
        } catch {
          // ignore avatar cache errors
        }
        const res = await getProfileDetails();
        if (!res.ok) {
          setError(res.message || 'Failed to load profile');
          return;
        }
        setProfile(res.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#141D35', '#1D2B4C', '#14223E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Profile</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
            {loading ? (
              <ActivityIndicator color="#1D2B4C" />
            ) : profile?.image || storedAvatar ? (
              <Image
                source={
                  profile?.image
                    ? { uri: profile.image }
                    : storedAvatar
                      ? { uri: storedAvatar }
                      : profileImage
                }
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.initialOverlay}>
                <Text style={styles.initialAvatarText}>{initialLetter || '?'}</Text>
              </View>
            )}
          </View>
            <Text style={styles.name}>{profile?.fullName || '—'}</Text>
            <Text style={styles.role}>{profile?.designation || profile?.company || ''}</Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoButton, uploading && { opacity: 0.6 }]}
              activeOpacity={0.8}
              disabled={uploading}
              onPress={async () => {
                const result = await launchImageLibrary({ mediaType: 'photo' });
                if (result.didCancel || !result.assets?.length) return;
                const asset = result.assets[0];
                if (!asset?.uri) return;
                try {
                  setUploading(true);
                  const res = await uploadProfileImage({
                    uri: asset.uri,
                    name: asset.fileName || 'profile.jpg',
                    type: asset.type || 'image/jpeg',
                  });
                  console.log('Profile image upload response:', res);
                  if (!res.ok) {
                    Alert.alert('Profile', res.message || 'Failed to upload image');
                    return;
                  }
                  setProfile((prev) => ({ ...(prev || {}), ...(res.data || {}) }));
                  if ((res.data as any)?.image) {
                    setStoredAvatar((res.data as any).image);
                  }
                } catch (err: any) {
                  Alert.alert('Profile', err?.message || 'Failed to upload image');
                } finally {
                  setUploading(false);
                }
              }}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#1D2B4C" />
              <Text style={styles.photoButtonText}>{uploading ? 'Uploading...' : 'Change Photo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  setUploading(true);
                  const res = await deleteProfileImage();
                  if (!res.ok) {
                    Alert.alert('Profile', res.message || 'Failed to remove image');
                    return;
                  }
                  setProfile((prev) => ({ ...(prev || {}), image: undefined }));
                  setStoredAvatar(null);
                  await AsyncStorage.removeItem('user_image');
                } catch (err: any) {
                  Alert.alert('Profile', err?.message || 'Failed to remove image');
                } finally {
                  setUploading(false);
                }
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#D14343" />
              <Text style={styles.photoButtonText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>

          {quickLinks.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, index === quickLinks.length - 1 && styles.lastRow]}
              activeOpacity={0.8}
              onPress={() => handleOpenSection(item.label)}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={item.icon} size={18} color="#6B7280" />
              </View>
              <Text style={styles.rowText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.lastRow]} activeOpacity={0.8}>
            <View style={styles.iconWrapper}>
              <Ionicons name="settings-outline" size={18} color="#6B7280" />
            </View>
            <Text style={styles.rowText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#D14343" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{selectedSection}</Text>
          <View style={styles.divider} />
          <View>
            {(selectedSection ? detailMap[selectedSection] : [])?.map(item => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  headerGradient: {
    paddingBottom: 12,
  },
  headerSafeArea: {
    paddingHorizontal: 12,
  },
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  initialOverlay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  role: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F0F1F3',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5A5A5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#D14343',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});

export default ProfileScreen;
