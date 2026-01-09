import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import { getQuotations, Quotation } from '../../../services/quotationService';

const statusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('draft')) return { bg: '#FEF3C7', text: '#92400E' };
  if (normalized.includes('sent')) return { bg: '#E0F2FE', text: '#075985' };
  if (normalized.includes('await')) return { bg: '#EDE9FE', text: '#5B21B6' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const QuotationScreen = () => {
  const navigation = useNavigation<any>();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const scrollRef = useRef<ScrollView | null>(null);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    quotes.forEach((quote) => {
      const s = (quote.status || '').trim().toLowerCase();
      if (s) set.add(s);
    });
    const options = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['all', ...options];
  }, [quotes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quotes.forEach((quote) => {
      const s = (quote.status || '').trim().toLowerCase() || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return quotes.filter((quote) => {
      const title = (quote.party_name || quote.name || '').toLowerCase();
      const status = (quote.status || '').trim().toLowerCase();
      if (q && !title.includes(q) && !status.includes(q)) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      return true;
    });
  }, [quotes, searchQuery, statusFilter]);

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getQuotations({ limit: 50 });
        console.log('Quotation list response:', res);
        if (!res.ok) {
          setError(res.message || 'Failed to load quotations');
          setQuotes([]);
          return;
        }
        setQuotes(res.data || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load quotations');
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };
    loadQuotes();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        pillText="Quotation"
        badgeCount={0}
        onBellPress={() => navigation.getParent?.()?.getParent?.()?.navigate?.('Notifications' as never)}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search quotations..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => console.log('Create quotation')}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          {statusOptions.map((opt) => {
            const active = statusFilter === opt;
            const label =
              opt === 'all'
                ? 'All'
                : opt
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
            const count = opt === 'all' ? quotes.length : statusCounts[opt] || 0;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setStatusFilter(opt);
                  requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
                }}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#3B82F6" />
            <Text style={styles.loaderText}>Loading quotations...</Text>
          </View>
        )}
        {!!error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && filteredQuotes.length === 0 && (
          <Text style={styles.emptyText}>No quotations found.</Text>
        )}

        {filteredQuotes.map((quote) => {
          const color = statusColor(quote.status || '');
          return (
            <View key={quote.name} style={styles.quoteCard}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteTitle}>{quote.party_name || 'Quotation'}</Text>
                  <Text style={styles.quoteSub}>{quote.name}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: color.bg }]}>
                  <Text style={[styles.statusChipText, { color: color.text }]}>{quote.status}</Text>
                </View>
                <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="more-vert" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaRow}>
                  <Icon name="calendar-today" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {quote.modified ? new Date(quote.modified).toLocaleDateString() : 'No date'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="payments" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {typeof quote.grand_total === 'number'
                      ? `${quote.currency || 'INR'} ${quote.grand_total.toLocaleString()}`
                      : quote.grand_total || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]}>
                  <Icon name="visibility" size={16} color="#2563EB" />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.sendBtn]}>
                  <Icon name="send" size={16} color="#7C3AED" />
                  <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewMoreBtn}>
                  <Text style={styles.viewMoreText}>Details</Text>
                  <Icon name="chevron-right" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flexGrow: 1, backgroundColor: '#FFFFFF', padding: 12, gap: 10 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  filterPill: {
    minWidth: 90,
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterText: { color: '#4B5563', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#1D4ED8' },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loaderText: { color: '#4B5563', fontSize: 14 },
  errorText: { color: '#DC2626', paddingVertical: 8 },
  emptyText: { color: '#6B7280', paddingVertical: 12 },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
    position: 'relative',
  },
  quoteTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  quoteSub: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#4B5563' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  viewBtn: { backgroundColor: '#EFF6FF' },
  sendBtn: { backgroundColor: '#F5F3FF' },
  viewMoreBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewMoreText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  moreBtn: {
    paddingHorizontal: 4,
  },
});

export default QuotationScreen;
