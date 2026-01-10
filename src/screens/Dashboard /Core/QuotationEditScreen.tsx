import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../../components/Header';
import { getQuotationDetail } from '../../../services/quotationService';
import { updateQuotation } from '../../../services/api/quotationEdit.service';
import DateTimePicker from '@react-native-community/datetimepicker';

type ItemEdit = {
  name?: string;
  doctype?: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  uom?: string;
  conversion_factor?: string;
  qty: string;
  rate: string;
};

const QuotationEditScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const quotationName = route?.params?.quotationName as string | undefined;
  const [detail, setDetail] = useState<any>(null);
  const [items, setItems] = useState<ItemEdit[]>([]);
  const [status, setStatus] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [validTill, setValidTill] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [docStatus, setDocStatus] = useState<number | null>(null);
  const [modified, setModified] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'transaction' | 'valid' | null>(null);
  const [pickerTempDate, setPickerTempDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!quotationName) {
      setError('Quotation id is missing.');
      return;
    }
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getQuotationDetail(quotationName);
        if (!res.ok) {
          setError(res.message || 'Failed to load quotation details');
          setDetail(null);
          return;
        }
        const doc = res.data || {};
        setDetail(doc);
        setStatus(doc?.status || '');
        setTransactionDate(doc?.transaction_date || '');
        setValidTill(doc?.valid_till || '');
        setTerms(doc?.terms || '');
        setNotes(doc?.notes || '');
        setDocStatus(
          typeof doc?.docstatus === 'number' ? doc.docstatus : Number.isNaN(Number(doc?.docstatus)) ? null : Number(doc?.docstatus)
        );
        setModified(doc?.modified || '');
        const mapped: ItemEdit[] = (doc?.items || []).map((item: any) => ({
          name: item?.name,
          doctype: item?.doctype,
          item_code: item?.item_code,
          item_name: item?.item_name,
          description: item?.description,
          uom: item?.uom,
          conversion_factor:
            item?.conversion_factor !== undefined && item?.conversion_factor !== null
              ? String(item.conversion_factor)
              : '1',
          qty: item?.qty !== undefined && item?.qty !== null ? String(item.qty) : '',
          rate: item?.rate !== undefined && item?.rate !== null ? String(item.rate) : '',
        }));
        setItems(mapped);
      } catch (err: any) {
        setError(err?.message || 'Failed to load quotation details');
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [quotationName]);

  const currency = detail?.currency || 'INR';

  const formatMoney = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return `${currency} ${num.toLocaleString()}`;
  };

  const computedItems = useMemo(() => {
    return items.map((item) => {
      const qtyNum = Number(item.qty || 0);
      const rateNum = Number(item.rate || 0);
      const amount = !Number.isNaN(qtyNum) && !Number.isNaN(rateNum) ? qtyNum * rateNum : 0;
      return { ...item, amount };
    });
  }, [items]);

  const totals = useMemo(() => {
    const total = computedItems.reduce((acc, item) => acc + (item.amount || 0), 0);
    return { total };
  }, [computedItems]);

  const docStatusLabel =
    docStatus === 0 ? 'Draft' : docStatus === 1 ? 'Submitted' : docStatus === 2 ? 'Cancelled' : '-';

  const toDateString = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const parseDateValue = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const openDatePicker = (target: 'transaction' | 'valid') => {
    const baseValue = target === 'transaction' ? transactionDate : validTill;
    const baseDate = parseDateValue(baseValue) || new Date();
    setPickerTarget(target);
    setPickerTempDate(baseDate);
    setPickerVisible(true);
  };

  const applyDate = (date: Date) => {
    const formatted = toDateString(date);
    if (pickerTarget === 'transaction') setTransactionDate(formatted);
    if (pickerTarget === 'valid') setValidTill(formatted);
  };

  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
      if (selected) applyDate(selected);
      setPickerTarget(null);
      return;
    }
    if (selected) setPickerTempDate(selected);
  };

  const applyIOSDate = () => {
    applyDate(pickerTempDate || new Date());
    setPickerVisible(false);
    setPickerTarget(null);
  };

  const updateItemField = (index: number, field: keyof ItemEdit, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    if (saving) return;
    if (!quotationName) return;
    if (docStatus !== null && docStatus !== 0) {
      Alert.alert('Quotation', 'Only draft quotations can be edited.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Quotation', 'At least one item is required.');
      return;
    }
    const invalidItem = computedItems.find(
      (item) => Number.isNaN(Number(item.qty)) || Number.isNaN(Number(item.rate))
    );
    if (invalidItem) {
      Alert.alert('Quotation', 'Please enter valid numbers for quantity and rate.');
      return;
    }

    setSaving(true);
    try {
      const payloadItems = computedItems.map((item) => ({
        name: item.name,
        doctype: item.doctype,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        uom: item.uom,
        qty: Number(item.qty || 0),
        rate: Number(item.rate || 0),
        amount: item.amount || 0,
        conversion_factor: Number(item.conversion_factor || 1) || 1,
      }));

      const res = await updateQuotation({
        name: quotationName,
        fields: {
          status,
          transaction_date: transactionDate,
          valid_till: validTill,
          terms,
          notes,
          modified,
        },
        items: payloadItems,
      });

      if (!res.ok) {
        Alert.alert('Quotation', res.message || 'Failed to update quotation');
        return;
      }
      Alert.alert('Quotation', 'Quotation updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Quotation', err?.message || 'Failed to update quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="Edit Quotation"
        showBack
        navigation={navigation as any}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator size="small" color="#1D3765" />
            <Text style={styles.subtleText}>Loading quotation...</Text>
          </View>
        )}
        {!!error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && detail && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Quotation</Text>
                  <Text style={styles.summaryValue}>{detail?.name || quotationName || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Customer</Text>
                  <Text style={styles.summaryValue}>
                    {detail?.party_name || detail?.customer_name || detail?.customer || '-'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Currency</Text>
                  <Text style={styles.summaryValue}>{currency}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Doc Status</Text>
                  <Text style={styles.summaryValue}>{docStatusLabel}</Text>
                </View>
              </View>
              {docStatus !== null && docStatus !== 0 && (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Editing locked</Text>
                  <Text style={styles.noticeText}>
                    Only draft quotations can be edited. Please create an amendment if changes are needed.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dates</Text>
              <View style={styles.sectionCard}>
                <Text style={styles.label}>Transaction Date (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  style={styles.input}
                  activeOpacity={0.85}
                  onPress={() => openDatePicker('transaction')}
                >
                  <Text style={transactionDate ? styles.valueText : styles.placeholderText}>
                    {transactionDate || 'Select date'}
                  </Text>
                </TouchableOpacity>
                {pickerVisible && pickerTarget === 'transaction' && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={pickerTempDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                    />
                    {Platform.OS === 'ios' && (
                      <View style={styles.pickerActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setPickerVisible(false);
                            setPickerTarget(null);
                          }}
                          style={styles.pickerAction}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={applyIOSDate} style={styles.pickerAction}>
                          <Text style={styles.primaryText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
                <Text style={styles.label}>Valid Till (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  style={styles.input}
                  activeOpacity={0.85}
                  onPress={() => openDatePicker('valid')}
                >
                  <Text style={validTill ? styles.valueText : styles.placeholderText}>
                    {validTill || 'Select date'}
                  </Text>
                </TouchableOpacity>
                {pickerVisible && pickerTarget === 'valid' && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={pickerTempDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                    />
                    {Platform.OS === 'ios' && (
                      <View style={styles.pickerActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setPickerVisible(false);
                            setPickerTarget(null);
                          }}
                          style={styles.pickerAction}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={applyIOSDate} style={styles.pickerAction}>
                          <Text style={styles.primaryText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.sectionCard}>
                <TextInput style={styles.input} value={status} onChangeText={setStatus} placeholder="Status" />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.sectionCard}>
                {computedItems.map((item, index) => (
                  <View key={`${item.name || index}`} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>
                      {item.item_name || item.item_code || `Item ${index + 1}`}
                    </Text>
                    {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                    <View style={styles.itemInputRow}>
                      <View style={styles.itemInputGroup}>
                        <Text style={styles.itemLabel}>Qty</Text>
                        <TextInput
                          style={styles.itemInput}
                          keyboardType="numeric"
                          value={item.qty}
                          onChangeText={(value) => updateItemField(index, 'qty', value)}
                        />
                      </View>
                      <View style={styles.itemInputGroup}>
                        <Text style={styles.itemLabel}>Rate</Text>
                        <TextInput
                          style={styles.itemInput}
                          keyboardType="numeric"
                          value={item.rate}
                          onChangeText={(value) => updateItemField(index, 'rate', value)}
                        />
                      </View>
                      <View style={styles.itemAmountGroup}>
                        <Text style={styles.itemLabel}>Amount</Text>
                        <Text style={styles.itemAmount}>{formatMoney(item.amount)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Totals</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{formatMoney(totals.total)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={terms}
                  onChangeText={setTerms}
                  placeholder="Terms"
                  multiline
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes"
                  multiline
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSave}
                disabled={saving || (docStatus !== null && docStatus !== 0)}
              >
                <Text style={styles.primaryText}>
                  {docStatus !== null && docStatus !== 0 ? 'Edit Locked' : saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  noticeCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 6,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: '#9A3412' },
  noticeText: { fontSize: 12, color: '#9A3412', lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  summaryValue: { fontSize: 12, color: '#111827', fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  label: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111827',
  },
  valueText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  placeholderText: { fontSize: 13, color: '#9CA3AF' },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  pickerAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  itemCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  itemDescription: { fontSize: 12, color: '#6B7280' },
  itemInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' },
  itemInputGroup: { minWidth: 90, gap: 6 },
  itemAmountGroup: { gap: 6 },
  itemLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  itemInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    minWidth: 80,
    color: '#111827',
  },
  itemAmount: { fontSize: 12, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButton: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  primaryButton: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  cancelText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtleText: { fontSize: 12, color: '#6B7280' },
  errorText: { color: '#DC2626', fontSize: 12 },
});

export default QuotationEditScreen;
