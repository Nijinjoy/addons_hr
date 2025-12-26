import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import { getLeads } from '../../../services/api/leads.service';

const LeadScreen = () => {
  const navigation = useNavigation<any>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => {
      const s = (lead.status || '').trim().toLowerCase();
      if (s) set.add(s);
    });
    const options = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['all', ...options];
  }, [leads]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const s = (lead.status || '').trim().toLowerCase() || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const title = (lead.company_name || lead.lead_name || lead.name || '').toLowerCase();
      const status = (lead.status || '').trim().toLowerCase();
      if (q && !title.includes(q) && !status.includes(q)) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      return true;
    });
  }, [leads, searchQuery, statusFilter]);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        setError('');
        const list = await getLeads(undefined, 50);
        setLeads(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.log('Lead fetch error:', err?.message || err);
        setError('Failed to load leads');
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => setOpenMenuId(null));
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, [statusFilter]);

  const handleCall = async (phone?: string | null) => {
    const raw = (phone || '').trim();
    const sanitized = raw.replace(/[^\d+]/g, '');
    if (!sanitized) {
      Alert.alert('Call', 'No phone number available for this lead.');
      return;
    }
    const telUrl = `tel:${sanitized}`;
    const telPromptUrl = `telprompt:${sanitized}`;
    try {
      const canTel = await Linking.canOpenURL(telUrl);
      if (canTel) {
        await Linking.openURL(telUrl);
        return;
      }
      const canPrompt = await Linking.canOpenURL(telPromptUrl);
      if (canPrompt) {
        await Linking.openURL(telPromptUrl);
        return;
      }
      throw new Error('No dialer available');
    } catch {
      Alert.alert('Call', 'Unable to open the dialer. Please try on a physical device.');
    }
  };

  const handleEmail = async (email?: string | null) => {
    const addr = (email || '').trim();
    if (!addr) {
      Alert.alert('Email', 'No email address available for this lead.');
      return;
    }
    const subject = encodeURIComponent('Regarding your inquiry');
    const body = encodeURIComponent('Hi,\n\n');
    const mailtoUrl = `mailto:${encodeURIComponent(addr)}?subject=${subject}&body=${body}`;
    const gmailUrl = `googlegmail://co?to=${encodeURIComponent(addr)}&subject=${subject}&body=${body}`;
    try {
      // Try default mail client first; some platforms return false for canOpenURL but still work
      const canMailto = await Linking.canOpenURL(mailtoUrl);
      if (canMailto) {
        await Linking.openURL(mailtoUrl);
        return;
      }
      await Linking.openURL(mailtoUrl).catch(() => {}); // attempt even if canOpenURL was false
      // If still here, try Gmail scheme
      const canGmail = await Linking.canOpenURL(gmailUrl);
      if (canGmail) {
        await Linking.openURL(gmailUrl);
        return;
      }
      throw new Error('No email app available');
    } catch (err: any) {
      Alert.alert('Email', 'Unable to open the email app on this device.');
    }
  };

  const handleMore = (lead: any, id: string | number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleMenuAction = (type: 'task' | 'event', lead: any) => {
    setOpenMenuId(null);
    const target = type === 'task' ? 'TaskCreate' : 'EventCreate';
    navigation.navigate(target, { lead });
  };

  return (
    <View style={styles.container}>
      <Header
        pillText="Leads"
        showBackButton
        badgeCount={0}
        onBackPress={() => navigation.goBack()}
        onBellPress={() => console.log('Notifications pressed')}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search leads..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('LeadCreate')}
          >
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#3B82F6" />
            <Text style={styles.loaderText}>Loading leads...</Text>
          </View>
        )}
        {!!error && !loading && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.filterRow}>
          {statusOptions.map((opt) => {
            const active = statusFilter === opt;
            const label =
              opt === 'all'
                ? `All (${leads.length})`
                : opt
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
            const count = opt === 'all' ? leads.length : statusCounts[opt] || 0;
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

        {!loading &&
          !error &&
          filteredLeads.map((lead, idx) => {
            const cardId = lead.name || idx;
            const showMenu = openMenuId === cardId;
            return (
              <View
                key={cardId}
                style={styles.leadCard}
                onStartShouldSetResponder={() => {
                  if (openMenuId !== null) setOpenMenuId(null);
                  return false;
                }}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadTitle}>{lead.company_name || lead.lead_name || lead.name}</Text>
                    <Text style={styles.leadSub}>{lead.lead_name || lead.company_name || '-'}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Text style={styles.statusChipText}>{lead.status || 'Open'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleMore(lead, cardId)}
                    style={styles.moreBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="more-vert" size={22} color="#6B7280" />
                  </TouchableOpacity>
                  {showMenu && (
                    <View style={styles.menu}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('task', lead)}>
                        <Text style={styles.menuItemText}>New Task</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('event', lead)}>
                        <Text style={styles.menuItemText}>New Event</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.cardMeta}>
                  <View style={styles.metaRow}>
                    <Icon name="email" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{lead.email_id || 'No email'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="call" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{lead.phone || lead.mobile_no || 'No phone'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="event" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {lead.creation ? new Date(lead.creation).toLocaleDateString() : 'No date'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.callBtn]}
                    onPress={() => handleCall(lead.mobile_no || lead.phone || '')}
                  >
                    <Icon name="call" size={16} color="#2563EB" />
                    <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.emailBtn]}
                    onPress={() => handleEmail(lead.email_id || '')}
                  >
                    <Icon name="email" size={16} color="#7C3AED" />
                    <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => {
                      setOpenMenuId(null);
                      navigation.navigate('LeadDetail', { lead });
                    }}
                  >
                    <Text style={styles.viewBtnText}>View</Text>
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
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loaderText: { color: '#4B5563', fontSize: 14 },
  errorText: { color: '#DC2626', paddingVertical: 8 },
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
  leadCard: {
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
  leadTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  leadSub: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChipText: { fontSize: 12, fontWeight: '700', color: '#0D1B2A' },
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
  callBtn: { backgroundColor: '#EFF6FF' },
  emailBtn: { backgroundColor: '#F5F3FF' },
  viewBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewBtnText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  moreBtn: {
    paddingHorizontal: 4,
  },
  menu: {
    position: 'absolute',
    top: 34,
    right: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 6,
    width: 140,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeadScreen;
