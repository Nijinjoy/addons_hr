import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../../components/Header';

interface LeaveBalance {
  type: string;
  available: number;
  used: number;
  total: number;
  color: string;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

const LeaveScreen = () => {
  const [leaveBalances] = useState<LeaveBalance[]>([
    { type: 'Annual Leave', available: 12, used: 8, total: 20, color: '#007AFF' },
    { type: 'Sick Leave', available: 5, used: 3, total: 8, color: '#FF3B30' },
    { type: 'Casual Leave', available: 7, used: 3, total: 10, color: '#34C759' },
  ]);

  const [leaveRequests] = useState<LeaveRequest[]>([
    {
      id: '1',
      type: 'Annual Leave',
      startDate: '2024-12-20',
      endDate: '2024-12-22',
      days: 3,
      status: 'pending',
      reason: 'Family vacation',
    },
    {
      id: '2',
      type: 'Sick Leave',
      startDate: '2024-12-10',
      endDate: '2024-12-11',
      days: 2,
      status: 'approved',
      reason: 'Medical appointment',
    },
    {
      id: '3',
      type: 'Casual Leave',
      startDate: '2024-11-28',
      endDate: '2024-11-28',
      days: 1,
      status: 'rejected',
      reason: 'Personal work',
    },
  ]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  const handleApplyLeave = () => {
    console.log('Apply for leave');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'pending':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="Leaves & Holidays"
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
        notificationCount={3}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          {leaveBalances.map((leave, index) => (
            <View key={index} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.leaveType}>{leave.type}</Text>
                <Text style={styles.availableDays}>
                  {leave.available} <Text style={styles.totalDays}>/ {leave.total}</Text>
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(leave.used / leave.total) * 100}%`,
                      backgroundColor: leave.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.usedText}>{leave.used} days used</Text>
            </View>
          ))}
        </View>

        {/* Apply Leave Button */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyLeave}>
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply for Leave</Text>
        </TouchableOpacity>

        {/* Leave Requests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {leaveRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestTypeContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.requestType}>{request.type}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(request.status)}
                    size={14}
                    color={getStatusColor(request.status)}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor(request.status) }]}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <Text style={styles.dateValue}>{request.startDate}</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <Text style={styles.dateValue}>{request.endDate}</Text>
                </View>
                <View style={styles.daysContainer}>
                  <Text style={styles.daysLabel}>Duration:</Text>
                  <Text style={styles.daysValue}>{request.days} day(s)</Text>
                </View>
              </View>

              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{request.reason}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  availableDays: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  totalDays: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  usedText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  daysLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  daysValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  reasonLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default LeaveScreen