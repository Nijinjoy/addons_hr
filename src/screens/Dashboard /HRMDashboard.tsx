import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HRMDashboard = () => {
  const navigation = useNavigation();
  
  const handleNavigate = (route: string) => {
    try {
      navigation.navigate(route as never);
    } catch (err) {
      console.log('Navigation error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="HRM"
        useGradient
        notificationCount={0}
        navigation={navigation as any}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Attendance</Text>
        <TouchableOpacity style={[styles.wideCard, styles.attendanceCard]} onPress={() => handleNavigate('Attendance')}>
          <View style={styles.wideCardLeft}>
            <MaterialCommunityIcons name="calendar-clock" size={30} color="#0D1B2A" />
            <View>
              <Text style={styles.cardTitle}>Attendance Overview</Text>
              <Text style={styles.cardSubtitle}>Today • Present • Hours logged: 0h</Text>
            </View>
          </View>
          <View style={styles.rowEnd}>
            <Text style={styles.linkText}>View</Text>
            <Ionicons name="chevron-forward" size={18} color="#0D1B2A" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>TimeSheet</Text>
        <TouchableOpacity style={styles.wideCard} onPress={() => handleNavigate('Timesheet')}>
          <View style={styles.wideCardLeft}>
            <Ionicons name="time-outline" size={26} color="#0D1B2A" />
            <View>
              <Text style={styles.cardTitle}>Fill Timesheet</Text>
              <Text style={styles.cardSubtitle}>Capture today’s work and billables</Text>
            </View>
          </View>
          <View style={styles.rowEnd}>
            <Text style={styles.linkText}>Go</Text>
            <Ionicons name="chevron-forward" size={20} color="#0D1B2A" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Tasks</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.card, styles.cardOutlined]} onPress={() => handleNavigate('Timesheet')}>
            <View style={styles.cardTop}>
              <Ionicons name="checkbox-outline" size={24} color="#0D1B2A" />
              <Text style={styles.statusBadge}>5 Open</Text>
            </View>
            <Text style={styles.cardTitle}>My Tasks</Text>
            <Text style={styles.cardSubtitle}>Prioritized for today</Text>
            <View style={styles.rowEnd}>
              <Text style={styles.linkText}>View</Text>
              <Ionicons name="chevron-forward" size={18} color="#0D1B2A" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardOutlined]} onPress={() => handleNavigate('Timesheet')}>
            <View style={styles.cardTop}>
              <Ionicons name="git-branch-outline" size={24} color="#007AFF" />
              <Text style={[styles.statusBadge, styles.badgeMuted]}>Team</Text>
            </View>
            <Text style={styles.cardTitle}>Team Tasks</Text>
            <Text style={styles.cardSubtitle}>Monitor blockers & status</Text>
            <View style={styles.rowEnd}>
              <Text style={styles.linkText}>View</Text>
              <Ionicons name="chevron-forward" size={18} color="#0D1B2A" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Leaves</Text>
        <TouchableOpacity style={styles.wideCard} onPress={() => handleNavigate('Leaves')}>
          <View style={styles.wideCardLeft}>
            <Ionicons name="leaf-outline" size={26} color="#0D1B2A" />
            <View>
              <Text style={styles.cardTitle}>Balance Overview</Text>
              <Text style={styles.cardSubtitle}>Casual: 6 • Sick: 4 • Earned: 10</Text>
            </View>
          </View>
          <View style={styles.rowEnd}>
            <Text style={styles.linkText}>Apply</Text>
            <Ionicons name="chevron-forward" size={18} color="#0D1B2A" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: {
    padding: 16,
    gap: 14,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  gradientPrimary: {
    backgroundColor: '#B7E1FF',
    borderColor: '#9CCCF2',
  },
  cardOutlined: {
    backgroundColor: '#fff',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#D1FADF',
    color: '#0F5132',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeMuted: {
    backgroundColor: '#E5E7EB',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F5F7FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wideCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendanceCard: {
    backgroundColor: '#E8F1FF',
    borderColor: '#D6E4FF',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});

export default HRMDashboard;
