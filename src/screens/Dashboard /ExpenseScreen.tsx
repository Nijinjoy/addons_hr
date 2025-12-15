import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getExpenseHistory,
  ExpenseHistoryItem,
  applyExpenseClaim,
  getExpenseTypes,
} from '../../services/expenseClaim';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const ExpenseScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Submit Tab States
  const [expenseType, setExpenseType] = useState('');
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);
  const [expenseTypeError, setExpenseTypeError] = useState('');
  const [showExpenseTypeDropdown, setShowExpenseTypeDropdown] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [billImage, setBillImage] = useState<any>(null);
  const [description, setDescription] = useState('');

  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });

    if (!result.didCancel && result.assets?.length) {
      setBillImage(result.assets[0]);
    }
  };

  const submitExpense = async () => {
    if (submittingExpense) return;
    if (!expenseType || !amount || !date) {
      console.log('Expense form missing fields');
      return;
    }
    try {
      setSubmittingExpense(true);
      const employee =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      if (!employee) {
        console.log('No employee id for expense claim');
        return;
      }
      const res = await applyExpenseClaim({
        employee,
        expense_type: expenseType,
        amount: Number(amount),
        posting_date: date.toISOString().slice(0, 10),
        description: description,
      });
      console.log('Apply expense claim response:', res);
      if (res.ok) {
        setExpenseType('');
        setAmount('');
        setDescription('');
        setBillImage(null);
        setShowNewExpenseForm(false);
        setShowExpenseTypeDropdown(false);
        fetchHistory();
      } else {
        console.log('Failed to apply expense claim', res.message);
      }
    } catch (err: any) {
      console.log('Expense claim submit error:', err?.message || err);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // New Expense Claim Form Modal
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);

  const tips = [
    { id: '1', text: 'Always attach clear receipt images' },
    { id: '2', text: 'Provide detailed descriptions' },
    { id: '3', text: 'Submit claims within 30 days' },
    { id: '4', text: 'Ensure amounts match receipts' },
  ];

  const formatAmount = (amount?: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'AED 0.00';
    return `AED ${amount.toFixed(2)}`;
  };

  const getStatusMeta = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'approved':
      case 'paid':
        return { color: '#4CAF50', icon: 'check-circle', label: 'Approved' };
      case 'rejected':
      case 'cancelled':
        return { color: '#F44336', icon: 'cancel', label: 'Rejected' };
      case 'draft':
        return { color: '#9CA3AF', icon: 'pending', label: 'Draft' };
      default:
        return { color: '#FF9800', icon: 'pending', label: 'Pending' };
    }
  };

  const renderHistoryItem = ({ item }: { item: ExpenseHistoryItem }) => {
    const statusMeta = getStatusMeta(item.status);
    return (
      <View style={styles.historyCard}>
        {/* Card Header */}
        <View style={styles.historyCardHeader}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyType}>{item.title || 'Expense Claim'}</Text>
            <View style={[styles.statusContainer, { backgroundColor: statusMeta.color + '15' }]}>
              <Icon
                name={statusMeta.icon}
                size={16}
                color={statusMeta.color}
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>
          <Text style={styles.historyAmount}>{formatAmount(item.sanctionedAmount || item.amount)}</Text>
        </View>

        {/* Description */}
        {!!item.description && <Text style={styles.historyDescription}>{item.description}</Text>}

        {/* Date and Submitted Date */}
        <View style={styles.dateContainer}>
          <View style={styles.dateRow}>
            <Icon name="calendar-today" size={14} color="#666" />
            <Text style={styles.historyDate}>{item.date || '-'}</Text>
          </View>
        </View>

        {/* Separator Line */}
        <View style={styles.separator} />
      </View>
    );
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError('');
      const employeeId =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      if (!employeeId) {
        setHistoryError('Employee id not found. Please log in.');
        setExpenseHistory([]);
        return;
      }
      const res = await getExpenseHistory({ employeeId, limit: 50 });
      console.log('ExpenseScreen history response:', res);
      if (!res.ok) {
        setHistoryError(typeof res.message === 'string' ? res.message : 'Failed to load expense history');
        return;
      }
      setExpenseHistory(res.data || []);
    } catch (error: any) {
      console.log('ExpenseScreen history fetch error:', error?.message || error);
      setHistoryError('Failed to load expense history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const loadExpenseTypes = async (force = false) => {
    if (loadingExpenseTypes) return;
    if (!force && expenseTypes.length) return;
    const fallbackTypes = ['Travel', 'Food', 'Fuel', 'Accommodation', 'Miscellaneous'];
    try {
      setLoadingExpenseTypes(true);
      setExpenseTypeError('');
      const res = await getExpenseTypes();
      console.log('ExpenseScreen expense types response:', res);
      if (!res.ok) {
        setExpenseTypeError(res.message || 'Failed to load expense types');
        if (expenseTypes.length === 0) {
          setExpenseTypes(fallbackTypes);
          console.log('Using fallback expense types:', fallbackTypes);
        }
        return;
      }
      setExpenseTypes(res.data || []);
      if ((res.data || []).length === 0) {
        setExpenseTypeError('No expense types found for your account.');
      }
    } catch (err: any) {
      console.log('ExpenseScreen expense types fetch error:', err?.message || err);
      setExpenseTypeError(err?.message || 'Failed to load expense types');
    } finally {
      setLoadingExpenseTypes(false);
    }
  };

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  return (
    <View style={styles.container}>
      <Header screenName="Expenses" navigation={navigation as any} />
      <View style={styles.whiteBackground}>

        {/* ---------- Tabs ---------- */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'submit' && styles.activeTab]}
            onPress={() => setActiveTab('submit')}
          >
            <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>
              Submit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Submit Tab Content (Reference Image Layout) ---------- */}
        {activeTab === 'submit' && !showNewExpenseForm && (
          <ScrollView style={styles.submitContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create a reimbursement request for your business expenses</Text>
            
            {/* New Expense Claim Button */}
            <TouchableOpacity 
              style={styles.newExpenseButton}
              onPress={() => setShowNewExpenseForm(true)}
            >
              <Icon name="add-circle-outline" size={24} color="#1D3765" />
              <Text style={styles.newExpenseButtonText}>New Expense Claim</Text>
            </TouchableOpacity>

            {/* Tips for Quick Approval Section */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Tips for Quick Approval</Text>
              {tips.map((tip) => (
                <View key={tip.id} style={styles.tipItem}>
                  <Icon name="check-circle" size={20} color="#4CAF50" style={styles.tipIcon} />
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ---------- New Expense Form (Modal-like) ---------- */}
        {activeTab === 'submit' && showNewExpenseForm && (
          <ScrollView style={styles.expenseFormContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={() => setShowNewExpenseForm(false)} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color="#1D3765" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>New Expense Claim</Text>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.label}>Expense Type</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  if (!showExpenseTypeDropdown && expenseTypes.length === 0) {
                    loadExpenseTypes(true);
                  }
                  setShowExpenseTypeDropdown((prev) => !prev);
                }}
                disabled={loadingExpenseTypes}
                activeOpacity={0.8}
              >
                <Text style={expenseType ? styles.selectValue : styles.selectPlaceholder}>
                  {expenseType ||
                    (loadingExpenseTypes ? 'Loading expense types...' : 'Select expense type')}
                </Text>
                <Icon
                  name={showExpenseTypeDropdown ? 'expand-less' : 'expand-more'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {showExpenseTypeDropdown && (
                <View style={styles.dropdownList}>
                  {expenseTypes.length === 0 && (
                    <Text style={styles.dropdownEmptyText}>
                      {loadingExpenseTypes ? 'Loading expense types...' : 'No expense types found'}
                    </Text>
                  )}
                  {expenseTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setExpenseType(type);
                        setShowExpenseTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {!!expenseTypeError && !loadingExpenseTypes && (
                <Text style={styles.helperText}>{expenseTypeError}</Text>
              )}

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBox}>
                <Icon name="calendar-today" size={20} color="#666" style={styles.dateIcon} />
                <Text style={styles.dateText}>{date.toDateString()}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Upload Bill</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                {billImage ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: billImage.uri }} style={styles.billImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setBillImage(null)}
                    >
                      <Icon name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Icon name="cloud-upload" size={40} color="#1D3765" />
                    <Text style={styles.uploadText}>Tap to upload bill</Text>
                    <Text style={styles.uploadSubText}>Supported formats: JPG, PNG, PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter details about this expense..."
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity style={styles.submitButton} onPress={submitExpense}>
                <Text style={styles.submitButtonText}>Submit Expense</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {loadingHistory && (
              <View style={styles.loaderRow}>
                <ActivityIndicator size="small" color="#1D3765" />
                <Text style={styles.loaderText}>Loading expense history...</Text>
              </View>
            )}

            {!!historyError && !loadingHistory && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{historyError}</Text>
              </View>
            )}

            {!loadingHistory && !historyError && expenseHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="receipt-long" size={64} color="#9CA3AF" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No expense history found.</Text>
                <Text style={styles.emptySubtitle}>Submit your first expense claim to see it here.</Text>
              </View>
            )}

            {!loadingHistory && !historyError && (
              <FlatList
                data={expenseHistory}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.historyList}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#14223E' 
  },

  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    overflow: 'hidden',
  },

  tabsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tabText: {
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 16,
  },
  activeTab: {
    backgroundColor: '#1D3765',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Submit Tab Styles
  submitContainer: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  newExpenseButton: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  newExpenseButtonText: {
    color: '#1D3765',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loaderText: {
    color: '#4B5563',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  tipsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },

  // Expense Form Styles
  expenseFormContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 15,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  formBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#111827',
  },
  selectBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 16,
    color: '#111827',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownEmptyText: {
    padding: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  helperText: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 13,
  },
  dateBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  uploadBox: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    minHeight: 150,
  },
  imagePreview: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  billImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#1D3765',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  uploadSubText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1D3765',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  // History Tab Styles (Updated to match reference)
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  historyType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 6,
    flexShrink: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D3765',
    marginBottom: 8,
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
});

export default ExpenseScreen;
