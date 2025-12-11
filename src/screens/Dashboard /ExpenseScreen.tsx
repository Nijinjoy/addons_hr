import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ExpenseScreen = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Submit Tab States
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [billImage, setBillImage] = useState<any>(null);
  const [description, setDescription] = useState('');

  // History Dummy Data (Later connect with ERPNext API)
  const historyData = [
    { id: '1', type: 'Travel', amount: '150', date: '2025-01-10', status: 'Approved' },
    { id: '2', type: 'Food', amount: '80', date: '2025-01-12', status: 'Pending' },
    { id: '3', type: 'Accommodation', amount: '200', date: '2025-01-08', status: 'Approved' },
    { id: '4', type: 'Transport', amount: '50', date: '2025-01-05', status: 'Rejected' },
  ];

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });

    if (!result.didCancel && result.assets?.length) {
      setBillImage(result.assets[0]);
    }
  };

  const submitExpense = () => {
    console.log('Submitting expense...');
  };

  // New Expense Claim Form Modal
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);

  const tips = [
    { id: '1', text: 'Always attach clear receipt images' },
    { id: '2', text: 'Provide detailed descriptions' },
    { id: '3', text: 'Submit claims within 30 days' },
    { id: '4', text: 'Ensure amounts match receipts' },
  ];

  return (
    <View style={styles.container}>
      <Header screenName="Expenses" />

      {/* White Background Screen Body */}
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
              <TextInput
                style={styles.input}
                placeholder="e.g. Travel, Food, Fuel"
                value={expenseType}
                onChangeText={setExpenseType}
              />

              <Text style={styles.label}>Amount (₹)</Text>
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

        {/* ---------- History Tab Content ---------- */}
        {activeTab === 'history' && (
          <FlatList
            data={historyData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyContainer}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyTitle}>{item.type}</Text>
                  <Text style={[
                    styles.statusBadge,
                    item.status === 'Approved' && styles.statusApproved,
                    item.status === 'Pending' && styles.statusPending,
                    item.status === 'Rejected' && styles.statusRejected,
                  ]}>
                    {item.status}
                  </Text>
                </View>
                <View style={styles.historyItemDetails}>
                  <Text style={styles.historyAmount}>₹ {item.amount}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
              </View>
            )}
            ListHeaderComponent={
              <Text style={styles.historyHeader}>Previous Expense Claims</Text>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14223E' },

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

  // History Tab Styles
  historyContainer: {
    padding: 20,
  },
  historyHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3765',
  },
  historyDate: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default ExpenseScreen;