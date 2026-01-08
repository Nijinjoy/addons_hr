import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import { getLeaveBalance, getLeaveApplications, applyLeave } from '../../../services/api/leave.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LeaveBalance {
  type: string;
  available: number;
  used: number;
  total: number;
  color: string;
}

interface LeaveHistoryItem {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string | null;
}

const LeaveScreen = () => {
  const navigation = useNavigation<any>();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyLeaveType, setApplyLeaveType] = useState('');
  const [applyFromDate, setApplyFromDate] = useState('');
  const [applyToDate, setApplyToDate] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveTypeOptions, setShowLeaveTypeOptions] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDateValue, setFromDateValue] = useState<Date | null>(null);
  const [toDateValue, setToDateValue] = useState<Date | null>(null);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  const handleApplyLeave = () => {
    if (!applyLeaveType) setApplyLeaveType(leaveTypeOptions[0]);
    setApplyModalVisible(true);
    setShowLeaveTypeOptions(false);
  };

  const leaveTypeOptions = leaveBalances.map((lb) => lb.type).filter(Boolean);

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

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        setBalanceError('');
        const companyUrl = (await AsyncStorage.getItem('company_url')) || '';
        const storedEmployee = (await AsyncStorage.getItem('employee_id')) || '';
        const fallbackUser = (await AsyncStorage.getItem('user_id')) || '';
        const employee = storedEmployee || fallbackUser;
        if (!employee) {
          setBalanceError('Employee id not found. Please log in again.');
          return;
        }
        const res = await getLeaveBalance(companyUrl, employee);
        console.log('LeaveScreen balance response:', res);
        const summary = (res || []) as { leave_type: string; allocated: number; used: number; available: number }[];

        const mapped: LeaveBalance[] = summary.map((item: any, idx: number) => {
          const total = Number(item.allocated || 0);
          const available = Number(item.available || 0);
          const used = Number(item.used || 0);
          const safeTotal = total || available + used;
          return {
            type: item.leave_type || `Leave ${idx + 1}`,
            available,
            used,
            total: safeTotal,
            color: colorPalette[idx % colorPalette.length],
          };
        });

        setLeaveBalances(mapped);
      } catch (error: any) {
        console.log('LeaveScreen balance fetch error:', error?.message || error);
        setBalanceError('Failed to load leave balance');
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
    refreshHistory();
  }, []);

  const refreshHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError('');
      const companyUrl = (await AsyncStorage.getItem('company_url')) || '';
      const storedEmployee = (await AsyncStorage.getItem('employee_id')) || '';
      const fallbackUser = (await AsyncStorage.getItem('user_id')) || '';
      const employee = storedEmployee || fallbackUser;
      if (!employee) {
        setHistoryError('Employee id not found. Please log in again.');
        return;
      }
      const res = await getLeaveApplications(companyUrl, employee, 50);
      console.log('LeaveScreen history response:', res);

      const mapped: LeaveHistoryItem[] = (res || []).map((item, idx) => ({
        id: item.id || item.name || String(idx),
        type: item.type || item.leave_type || 'Leave',
        startDate: item.startDate || item.from_date || '',
        endDate: item.endDate || item.to_date || '',
        days: Number(item.days ?? item.total_leave_days ?? 0) || 0,
        status: item.status || 'pending',
        reason: item.reason || item.description || '',
      }));

      setLeaveHistory(mapped);
    } catch (error: any) {
      console.log('LeaveScreen history fetch error:', error?.message || error);
      setHistoryError('Failed to load leave history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const colorPalette = useMemo(
    () => ['#007AFF', '#FF3B30', '#34C759', '#8E8E93', '#FF9500', '#5856D6'],
    []
  );

  return (
    <View style={styles.container}>
      <Header
        screenName="Leaves & Holidays"
        showBack
        onBackPress={() => navigation.goBack()}
        onNotificationPress={handleNotificationPress}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
        notificationCount={3}
        navigation={navigation as any}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          {loadingBalance && (
            <View style={styles.balanceLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loaderText}>Loading leave balance...</Text>
            </View>
          )}
          {!!balanceError && !loadingBalance && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{balanceError}</Text>
            </View>
          )}
          {!loadingBalance && !balanceError && leaveBalances.length === 0 && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>No leave balances found.</Text>
            </View>
          )}
          {!loadingBalance &&
            !balanceError &&
            leaveBalances.map((leave, index) => (
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
                        width: `${leave.total ? Math.max(0, Math.min(100, (leave.available / leave.total) * 100)) : 0}%`,
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
          <Text style={styles.applyButtonText}>Request for Leave</Text>
        </TouchableOpacity>

        {/* Leave History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave History</Text>
          {loadingHistory && (
            <View style={styles.balanceLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loaderText}>Loading leave history...</Text>
            </View>
          )}
          {!!historyError && !loadingHistory && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{historyError}</Text>
            </View>
          )}
          {!loadingHistory && !historyError && leaveHistory.length === 0 && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>No leave history found.</Text>
            </View>
          )}
          {!loadingHistory &&
            !historyError &&
            leaveHistory.map((request) => {
              const status = (request.status || '').toLowerCase();
              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTypeContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                      <Text style={styles.requestType}>{request.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(status)}
                        size={14}
                        color={getStatusColor(status)}
                      />
                      <Text
                        style={[styles.statusText, { color: getStatusColor(status) }]}
                      >
                        {status
                          ? status.charAt(0).toUpperCase() + status.slice(1)
                          : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestDetails}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateLabel}>From:</Text>
                      <Text style={styles.dateValue}>{request.startDate || '-'}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateLabel}>To:</Text>
                      <Text style={styles.dateValue}>{request.endDate || '-'}</Text>
                    </View>
                    <View style={styles.daysContainer}>
                      <Text style={styles.daysLabel}>Duration:</Text>
                      <Text style={styles.daysValue}>{request.days || 0} day(s)</Text>
                    </View>
                  </View>

                  {!!request.reason && (
                    <>
                      <Text style={styles.reasonLabel}>Reason:</Text>
                      <Text style={styles.reasonText}>{request.reason}</Text>
                    </>
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Apply for Leave</Text>
            <Text style={styles.modalSubtitle}>
              Fill in the details below to submit your leave request.
            </Text>

            <Text style={styles.modalLabel}>Leave Type</Text>
            <TouchableOpacity
              style={styles.modalSelect}
              onPress={() => setShowLeaveTypeOptions((prev) => !prev)}
            >
              <Text style={applyLeaveType ? styles.modalSelectValue : styles.modalSelectPlaceholder}>
                {applyLeaveType || 'Select leave type'}
              </Text>
              <Ionicons
                name={showLeaveTypeOptions ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6B7280"
              />
            </TouchableOpacity>
            {showLeaveTypeOptions && (
              <View style={styles.dropdownList}>
                {leaveTypeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setApplyLeaveType(opt);
                      setShowLeaveTypeOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>From Date</Text>
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowFromPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={applyFromDate ? styles.modalSelectValue : styles.modalSelectPlaceholder}>
                {applyFromDate || 'Select from date'}
              </Text>
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={fromDateValue || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowFromPicker(false);
                  if (date) {
                    setFromDateValue(date);
                    setApplyFromDate(date.toISOString().slice(0, 10));
                  }
                }}
              />
            )}

            <Text style={styles.modalLabel}>To Date</Text>
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowToPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={applyToDate ? styles.modalSelectValue : styles.modalSelectPlaceholder}>
                {applyToDate || 'Select to date'}
              </Text>
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={toDateValue || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowToPicker(false);
                  if (date) {
                    setToDateValue(date);
                    setApplyToDate(date.toISOString().slice(0, 10));
                  }
                }}
              />
            )}

            <Text style={styles.modalLabel}>Reason</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Reason for leave"
              value={applyReason}
              onChangeText={setApplyReason}
              multiline
            />

            <TouchableOpacity
              style={[styles.applyButton, styles.modalApplyButton, submitting && { opacity: 0.7 }]}
              onPress={async () => {
                if (submitting) return;
                if (!applyLeaveType || !applyFromDate || !applyToDate) {
                  console.log('Leave apply: missing fields');
                  return;
                }
                try {
                  setSubmitting(true);
                  const companyUrl = (await AsyncStorage.getItem('company_url')) || '';
                  const storedEmployee = (await AsyncStorage.getItem('employee_id')) || '';
                  const fallbackUser = (await AsyncStorage.getItem('user_id')) || '';
                  const employee = storedEmployee || fallbackUser;
                  await applyLeave({
                    companyUrl,
                    employee,
                    leave_type: applyLeaveType,
                    from_date: applyFromDate,
                    to_date: applyToDate,
                    description: applyReason,
                  });
                  console.log('Apply leave response: success');
                  // Optimistically refresh history list
                  setApplyModalVisible(false);
                  setApplyReason('');
                  setApplyFromDate('');
                  setApplyToDate('');
                  setApplyLeaveType('');
                  await refreshHistory();
                } catch (err: any) {
                  const msg = err?.message || 'Failed to apply leave';
                  setHistoryError(msg);
                  console.log('Apply leave error:', msg);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>
                {submitting ? 'Applying...' : 'Apply Leave'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setApplyModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  balanceLoader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#4B5563',
  },
  usedText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  errorCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSelect: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSelectPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  modalSelectValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000000',
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
  modalApplyButton: {
    marginHorizontal: 0,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
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
