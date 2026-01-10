import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../../../components/Header';
import {
  buildLeadDetailSections,
  fetchLeadDetail,
  LeadDetailSection,
} from '../../../services/api/leadDetails.service';

const LeadDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [sections, setSections] = useState<LeadDetailSection[]>([]);
  const [lead, setLead] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const loadLead = async () => {
      const leadName = route?.params?.lead?.name;
      if (!leadName) {
        setSections([]);
        setLead(null);
        return;
      }
      try {
        const lead = await fetchLeadDetail(leadName);
        if (!mounted) return;
        setLead(lead);
        const nextSections = buildLeadDetailSections(lead);
        setSections(nextSections);
        setExpandedSections((prev) => {
          if (Object.keys(prev).length) return prev;
          const initial: Record<string, boolean> = {};
          nextSections.forEach((section) => {
            initial[section.title] = true;
          });
          return initial;
        });
      } catch (err: any) {
        if (!mounted) return;
        console.log('LeadDetailScreen load failed:', err?.message || err);
        setSections([]);
        setLead(null);
      }
    };
    loadLead();
    return () => {
      mounted = false;
    };
  }, [route?.params?.lead?.name]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const handleCall = async (phone?: string | null) => {
    const raw = (phone || '').trim();
    const sanitized = raw.replace(/[^\d+]/g, '');
    if (!sanitized) {
      Alert.alert('Call', 'No phone number available for this lead.');
      return;
    }
    const telUrl = `tel:${sanitized}`;
    try {
      await Linking.openURL(telUrl);
    } catch {
      Alert.alert('Call', 'Unable to open the dialer.');
    }
  };

  const handleEmail = async (email?: string | null) => {
    const addr = (email || '').trim();
    if (!addr) {
      Alert.alert('Email', 'No email address available for this lead.');
      return;
    }
    const url = `mailto:${encodeURIComponent(addr)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email', 'Unable to open the email app.');
    }
  };

  const leadDate = lead?.creation ? new Date(lead.creation).toLocaleDateString() : '-';
  const leadName = lead?.lead_name || lead?.company_name || lead?.name || '-';
  const leadSource = lead?.source || '-';
  const leadStatus = lead?.status || 'Open';
  const leadSubtitle = lead?.company_name || lead?.lead_name || 'Lead';

  const statusTone = useMemo(() => {
    const status = String(leadStatus || '').toLowerCase();
    if (status.includes('open')) return { bg: '#DCFCE7', text: '#166534' };
    if (status.includes('quotation')) return { bg: '#FFEDD5', text: '#9A3412' };
    if (status.includes('lost')) return { bg: '#FEE2E2', text: '#991B1B' };
    return { bg: '#E5E7EB', text: '#374151' };
  }, [leadStatus]);

  const toggleSection = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <View style={styles.container}>
      <Header
        pillText="Lead Details"
        showBackButton
        onBackPress={() => navigation.goBack?.()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryAvatar}>
              <Ionicons name="person-outline" size={20} color="#111827" />
            </View>
            <View style={styles.summaryTitleBlock}>
              <Text style={styles.summaryName}>{leadName}</Text>
              <Text style={styles.summarySubtitle}>{leadSubtitle}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}>
              <Text style={[styles.statusPillText, { color: statusTone.text }]}>
                {leadStatus}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{leadDate}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Source</Text>
              <Text style={styles.summaryValue}>{leadSource}</Text>
            </View>
          </View>
          <View style={styles.summaryActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() =>
                handleCall(
                  lead?.mobile_no || lead?.phone || lead?.whatsapp || lead?.whatsapp_no || ''
                )
              }
            >
              <Ionicons name="call-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionPrimaryText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => handleEmail(lead?.email_id || '')}
            >
              <Ionicons name="mail-outline" size={16} color="#111827" />
              <Text style={styles.actionSecondaryText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('LeadCreate', {
                  lead,
                  onLeadUpdated: () => {},
                })
              }
            >
              <Ionicons name="create-outline" size={16} color="#111827" />
              <Text style={styles.actionNeutralText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.title)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{section.rows.length}</Text>
                </View>
              </View>
              <Ionicons
                name={expandedSections[section.title] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>
            {expandedSections[section.title] && (
              <View style={styles.sectionCard}>
                {section.rows.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.row,
                      index === section.rows.length - 1 && styles.rowLast,
                    ]}
                  >
                    <Text style={styles.label}>{row.label}</Text>
                    <Text style={styles.value}>{row.value || '-'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        {sections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lead details available.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  summaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleBlock: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  actionPrimary: {
    backgroundColor: '#111827',
  },
  actionSecondary: {
    backgroundColor: '#E5E7EB',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  actionSecondaryText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  actionNeutralText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
});

export default LeadDetailScreen;
