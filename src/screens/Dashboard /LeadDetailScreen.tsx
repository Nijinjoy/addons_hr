import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Lead } from '../../services/leadService';
import { LeadStackParamList } from '../../navigation/LeadStack';
import Header from '../../components/Header';

type LeadDetailRouteProp = RouteProp<LeadStackParamList, 'LeadDetail'>;

const LeadDetailScreen = () => {
  const { params } = useRoute<LeadDetailRouteProp>();
  const navigation = useNavigation();
  const lead: Lead = params?.lead || ({} as Lead);

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
    const url = `mailto:${encodeURIComponent(addr)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Cannot open mail app');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email', 'Unable to open the email app.');
    }
  };

  const sections: { title: string; rows: { label: string; value?: string }[] }[] =
    [
      {
        title: 'General',
        rows: [
          { label: 'Date', value: lead.creation ? new Date(lead.creation).toLocaleString() : '-' },
          { label: 'Full Name', value: lead.lead_name || lead.company_name || lead.name },
          { label: 'Job Title', value: (lead as any)?.job_title || '-' },
          { label: 'Gender', value: (lead as any)?.gender || '-' },
          { label: 'Status', value: lead.status || 'Open' },
          { label: 'Lead Type', value: (lead as any)?.lead_type || '-' },
          { label: 'Request Type', value: (lead as any)?.request_type || '-' },
          { label: 'Service Type', value: (lead as any)?.service_type || '-' },
          { label: 'Source', value: lead.source || '-' },
        ],
      },
      {
        title: 'Contact',
        rows: [
          { label: 'Email', value: lead.email_id || '-' },
          { label: 'Mobile No', value: lead.mobile_no || lead.phone || '-' },
          { label: 'WhatsApp', value: (lead as any)?.whatsapp || '-' },
        ],
      },
      {
        title: 'Organization',
        rows: [
          { label: 'Organization Name', value: lead.company_name || '-' },
          { label: 'Building & Location', value: (lead as any)?.building || (lead as any)?.location || '-' },
          { label: 'Territory', value: (lead as any)?.territory || '-' },
          { label: 'No of Employees', value: (lead as any)?.no_of_employees || (lead as any)?.number_of_employees || '-' },
          { label: 'Industry', value: (lead as any)?.industry || '-' },
        ],
      },
      {
        title: 'Ownership',
        rows: [
          { label: 'Lead Owner', value: (lead as any)?.owner || '-' },
          { label: 'Associate Details', value: (lead as any)?.associate_details || '-' },
        ],
      },
    ];

  return (
    <View style={styles.container}>
      <Header
        screenName="Lead Details"
        onBackPress={() => navigation.goBack?.()}
        showBack
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>
                {lead.lead_name || lead.company_name || lead.name}
              </Text>
              <Text style={styles.heroSubtitle}>{lead.company_name || 'Lead'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.statusPillText, { color: '#4F46E5' }]}>
                {(lead.status || 'Open').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="briefcase-outline" size={14} color="#4B5563" />
              <Text style={styles.metaChipText}>
                {(lead as any)?.lead_type || 'Lead'}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="sparkles-outline" size={14} color="#4B5563" />
              <Text style={styles.metaChipText}>{lead.source || 'Source N/A'}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color="#4B5563" />
              <Text style={styles.metaChipText}>
                {lead.creation
                  ? new Date(lead.creation).toLocaleDateString()
                  : 'Date N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleCall(lead.mobile_no || lead.phone || '')}
            >
              <Ionicons name="call-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleEmail(lead.email_id || '')}
            >
              <Ionicons name="mail-outline" size={18} color="#1D4ED8" />
              <Text style={styles.secondaryButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.rows.map(row => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value || '-'}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 12,
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
});

export default LeadDetailScreen;
