import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const sampleNotifications = [
  {
    id: '1',
    title: 'Check-in recorded',
    message: 'Your 9:00 AM check-in was saved successfully.',
    time: '2m ago',
  },
  {
    id: '2',
    title: 'Shift reminder',
    message: 'Your shift starts at 9:00 AM tomorrow.',
    time: '1h ago',
  },
  {
    id: '3',
    title: 'Leave update',
    message: 'Your leave request has been approved.',
    time: 'Yesterday',
  },
];

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Header
        screenName="Notifications"
        showBack
        navigation={navigation as any}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {sampleNotifications.map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="notifications" size={18} color="#0F172A" />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row', gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  message: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
});

export default NotificationScreen;
