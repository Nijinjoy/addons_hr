import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../../../components/Header';
import { getQuotationDetail } from '../../../services/quotationService';

const QuotationDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const quotationName = route?.params?.quotationName as string | undefined;
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        console.log('Quotation detail response:', res);
        if (!res.ok) {
          setError(res.message || 'Failed to load quotation details');
          setDetail(null);
          return;
        }
        console.log('Quotation detail data:', res.data);
        setDetail(res.data || null);
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

  const infoRows = useMemo(
    () => [
      { label: 'Quotation To', value: detail?.quotation_to || '-' },
      { label: 'Status', value: detail?.status || '-' },
      { label: 'Date', value: detail?.transaction_date || '-' },
      { label: 'Valid Till', value: detail?.valid_till || '-' },
      { label: 'Company', value: detail?.company || '-' },
    ],
    [detail, quotationName, currency]
  );

  const items = Array.isArray(detail?.items) ? detail.items : [];

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const allFields = useMemo(() => {
    if (!detail) return [];
    return Object.entries(detail)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const formatted = formatValue(value);
        const isLong = formatted.length > 120 || formatted.includes('\n') || formatted.includes('{') || formatted.includes('[');
        return { key, label: formatLabel(key), value: formatted, isLong };
      });
  }, [detail]);

  const statusTone = useMemo(() => {
    const status = String(detail?.status || '').toLowerCase();
    if (status.includes('draft')) return { bg: '#FEF3C7', text: '#92400E' };
    if (status.includes('sent') || status.includes('approved')) return { bg: '#DBEAFE', text: '#1D4ED8' };
    if (status.includes('lost') || status.includes('cancel')) return { bg: '#FEE2E2', text: '#991B1B' };
    return { bg: '#E5E7EB', text: '#374151' };
  }, [detail?.status]);

  return (
    <View style={styles.container}>
      <Header
        screenName="Quotation Details"
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
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryAvatar}>
                  <Ionicons name="document-text-outline" size={20} color="#0F172A" />
                </View>
                <View style={styles.summaryTitleBlock}>
                  <Text style={styles.summaryName}>{detail?.name || quotationName || '-'}</Text>
                  <Text style={styles.summarySubtitle}>
                    {detail?.party_name || detail?.customer_name || detail?.customer || '-'}
                  </Text>
                </View>
                <View style={styles.summaryActions}>
                  <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}>
                    <Text style={[styles.statusPillText, { color: statusTone.text }]}>
                      {detail?.status || '-'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('QuotationEdit', { quotationName: detail?.name || quotationName })}
                  >
                    <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.summaryGrid}>
                {infoRows.map((row) => (
                  <View key={row.label} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Totals</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Total</Text>
                  <Text style={styles.summaryValue}>{formatMoney(detail?.net_total ?? detail?.total)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>{formatMoney(detail?.total_taxes_and_charges)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Grand Total</Text>
                  <Text style={styles.summaryValue}>{formatMoney(detail?.grand_total)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outstanding</Text>
                  <Text style={styles.summaryValue}>{formatMoney(detail?.outstanding_amount)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              {items.length === 0 && <Text style={styles.subtleText}>No items found.</Text>}
              {items.map((item: any, index: number) => (
                <View key={`${item?.name || index}`} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{item?.item_name || item?.item_code || `Item ${index + 1}`}</Text>
                  {!!item?.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                  <View style={styles.itemRow}>
                    <Text style={styles.itemMeta}>Qty: {item?.qty ?? '-'}</Text>
                    <Text style={styles.itemMeta}>Rate: {formatMoney(item?.rate)}</Text>
                    <Text style={styles.itemMeta}>Amount: {formatMoney(item?.amount)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {!!detail?.terms && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terms</Text>
                <View style={styles.summaryCard}>
                  <Text style={styles.termsText}>{detail.terms}</Text>
                </View>
              </View>
            )}

            {!!detail?.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.summaryCard}>
                  <Text style={styles.termsText}>{detail.notes}</Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Fields</Text>
              <View style={styles.fieldsWrap}>
                {allFields.map((field) => (
                  <View
                    key={field.key}
                    style={[styles.fieldCard, field.isLong && styles.fieldCardWide]}
                  >
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={[styles.fieldValue, field.isLong && styles.fieldValueLong]}>
                      {field.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

          </>
        )}

        {!loading && !error && !detail && (
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleBlock: { flex: 1 },
  summaryName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  summarySubtitle: { fontSize: 12, color: '#475569', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  summaryActions: { alignItems: 'flex-end', gap: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '47%', gap: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  summaryValue: { fontSize: 12, color: '#0F172A', fontWeight: '700', flexShrink: 1 },
  itemCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  itemDescription: { fontSize: 12, color: '#6B7280' },
  itemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  itemMeta: { fontSize: 12, color: '#374151', fontWeight: '600' },
  termsText: { fontSize: 12, color: '#374151', lineHeight: 18 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtleText: { fontSize: 12, color: '#6B7280' },
  errorText: { color: '#DC2626', fontSize: 12 },
  fieldsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  fieldCardWide: {
    width: '100%',
    backgroundColor: '#F8FAFF',
  },
  fieldLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  fieldValue: { fontSize: 12, color: '#0F172A', fontWeight: '600' },
  fieldValueLong: { fontSize: 11, color: '#475569' },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  retryText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});

export default QuotationDetailScreen;
