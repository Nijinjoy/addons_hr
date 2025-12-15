import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Lead } from '../../services/leadService';
import { LeadStackParamList } from '../../navigation/LeadStack';
import Header from '../../components/Header';

type LeadDetailRouteProp = RouteProp<LeadStackParamList, 'LeadDetail'>;

const LeadDetailScreen = () => {
  const { params } = useRoute<LeadDetailRouteProp>();
  const navigation = useNavigation();
  const lead: Lead = params?.lead || ({} as Lead);

  const rows: { label: string; value?: string }[] = [
    { label: 'Name', value: lead.lead_name || lead.company_name || lead.name },
    { label: 'Company', value: lead.company_name || '-' },
    { label: 'Status', value: lead.status || 'Open' },
    { label: 'Email', value: lead.email_id || '-' },
    { label: 'Phone', value: lead.phone || lead.mobile_no || '-' },
    { label: 'Source', value: lead.source || '-' },
    {
      label: 'Created On',
      value: lead.creation
        ? new Date(lead.creation).toLocaleString()
        : '-',
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
        <View style={styles.card}>
          {rows.map(row => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value || '-'}</Text>
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
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
