import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LeadScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  
  const handleNotificationPress = () => {
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  // Sample leads data
  const leads = [
    {
      id: 1,
      companyName: 'Tech Solutions Inc',
      contactName: 'John Smith',
      status: 'Qualified',
      amount: '$ 50k',
      source: 'Website',
      description: 'Interested in enterprise package',
      email: 'john@techsolutions.com',
      phone: '+1 234-567-8901',
      location: 'New York, NY',
      addedDate: '10/15/2025',
      emailChecked: false,
      locationChecked: true,
    },
    {
      id: 2,
      companyName: 'Global Marketing Ltd',
      contactName: 'Sarah Johnson',
      status: 'Proposal',
      amount: '$ 75k',
      source: 'Referral',
      description: 'Needs customization for team of 50',
      email: 'sarah@globalmarketing.com',
      phone: '+1 234-567-8902',
      location: 'Los Angeles, CA',
      addedDate: '10/10/2025',
      emailChecked: false,
      locationChecked: true,
    },
    {
      id: 3,
      companyName: 'Digital Innovations',
      contactName: 'Michael Chen',
      status: 'Contacted',
      amount: '$ 35k',
      source: 'Social Media',
      description: 'Looking for mobile app development',
      email: 'michael@digitalinnovations.com',
      phone: '+1 234-567-8903',
      location: 'San Francisco, CA',
      addedDate: '10/05/2025',
      emailChecked: true,
      locationChecked: true,
    },
    {
      id: 4,
      companyName: 'Ecommerce Pro',
      contactName: 'Emily Davis',
      status: 'Qualified',
      amount: '$ 90k',
      source: 'Website',
      description: 'Requires full ecommerce solution',
      email: 'emily@ecommercepro.com',
      phone: '+1 234-567-8904',
      location: 'Chicago, IL',
      addedDate: '10/01/2025',
      emailChecked: false,
      locationChecked: false,
    },
  ];

  // Status filter tabs
  const statusFilterTabs = [
    { id: 'all', label: 'All', color: '#6B7280' },
    { id: 'qualified', label: 'Qualified', color: '#10B981' },
    { id: 'proposal', label: 'Proposal', color: '#3B82F6' },
    { id: 'contacted', label: 'Contacted', color: '#F59E0B' },
    { id: 'converted', label: 'Converted', color: '#8B5CF6' },
    { id: 'lost', label: 'Lost', color: '#EF4444' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Qualified': return '#10B981';
      case 'Proposal': return '#3B82F6';
      case 'Contacted': return '#F59E0B';
      case 'Converted': return '#8B5CF6';
      case 'Lost': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Qualified': return '#D1FAE5';
      case 'Proposal': return '#DBEAFE';
      case 'Contacted': return '#FEF3C7';
      case 'Converted': return '#F5F3FF';
      case 'Lost': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Website': return 'language';
      case 'Referral': return 'group';
      case 'Social Media': return 'share';
      case 'Email': return 'email';
      case 'Call': return 'call';
      default: return 'source';
    }
  };

  // Filter leads based on active filters
  const filteredLeads = leads.filter(lead => {
    if (activeStatusFilter === 'all') return true;
    
    const statusMap = {
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'contacted': 'Contacted',
      'converted': 'Converted',
      'lost': 'Lost'
    };
    
    return lead.status === statusMap[activeStatusFilter];
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="white"
        translucent={Platform.OS === 'android'}
      />
      
      <Header
        screenName="Leads"
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
        notificationCount={2}
      />

      {/* White background container below header */}
      <View style={styles.whiteContainer}>
        {/* Fixed Search/Filter Bar with Add Button */}
        <View style={styles.fixedSearchContainer}>
          <View style={styles.searchInput}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Search leads...</Text>
          </View>
          <TouchableOpacity style={styles.addLeadButton}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Fixed Status Filter Tabs */}
        <View style={styles.fixedStatusFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilterContent}
          >
            {statusFilterTabs.map((tab) => (
              <TouchableOpacity 
                key={tab.id}
                style={[
                  styles.statusFilterTab,
                  activeStatusFilter === tab.id && [
                    styles.activeStatusFilterTab,
                    { backgroundColor: `${tab.color}15` }
                  ]
                ]}
                onPress={() => setActiveStatusFilter(tab.id)}
              >
                {tab.id !== 'all' && (
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: tab.color }
                  ]} />
                )}
                <Text style={[
                  styles.statusFilterTabText,
                  activeStatusFilter === tab.id && [
                    styles.activeStatusFilterTabText,
                    { color: tab.color }
                  ]
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 16,
              // Add padding top to account for fixed headers
              paddingTop: 0,
            }
          ]}
        >
          {/* Leads List - Or Empty State */}
          <View style={styles.leadsList}>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <View key={lead.id} style={styles.leadCard}>
                  {/* Company Header */}
                  <View style={styles.companyHeader}>
                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{lead.companyName}</Text>
                      <Text style={styles.contactName}>{lead.contactName}</Text>
                    </View>
                    <View style={styles.headerActions}>
                      <TouchableOpacity style={styles.starButton}>
                        <Icon name="star-border" size={22} color="#F59E0B" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.moreButton}>
                        <Icon name="more-vert" size={24} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Status and Amount Row */}
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(lead.status) }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(lead.status) }
                      ]}>
                        {lead.status}
                      </Text>
                    </View>
                    
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountText}>{lead.amount}</Text>
                      <View style={styles.sourceBadge}>
                        <Icon 
                          name={getSourceIcon(lead.source)} 
                          size={14} 
                          color="#6B7280" 
                          style={styles.sourceIcon}
                        />
                        <Text style={styles.sourceText}>{lead.source}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Description */}
                  <Text style={styles.descriptionText}>
                    {lead.description}
                  </Text>

                  {/* Contact Info */}
                  <View style={styles.contactInfo}>
                    {/* Email Row */}
                    <View style={styles.contactRow}>
                      <View style={styles.checkboxContainer}>
                        {lead.emailChecked ? (
                          <Icon name="check-box" size={20} color="#10B981" />
                        ) : (
                          <Icon name="check-box-outline-blank" size={20} color="#9CA3AF" />
                        )}
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.emailText}>{lead.email}</Text>
                        <Text style={styles.phoneText}>{lead.phone}</Text>
                      </View>
                    </View>

                    {/* Location Row */}
                    <View style={styles.contactRow}>
                      <View style={styles.checkboxContainer}>
                        {lead.locationChecked ? (
                          <Icon name="check-box" size={20} color="#10B981" />
                        ) : (
                          <Icon name="check-box-outline-blank" size={20} color="#9CA3AF" />
                        )}
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.locationText}>{lead.location}</Text>
                        <Text style={styles.addedText}>Added: {lead.addedDate}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.callButton}>
                      <Icon name="call" size={18} color="#3B82F6" />
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.emailButton}>
                      <Icon name="email" size={18} color="#8B5CF6" />
                      <Text style={styles.emailButtonText}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View Details</Text>
                      <Icon name="chevron-right" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              // Empty state when no leads
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="search-off" size={60} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyStateTitle}>
                  No leads found
                </Text>
                <Text style={styles.emptyStateText}>
                  {activeStatusFilter === 'all' 
                    ? "You don't have any leads yet." 
                    : `No ${activeStatusFilter} leads found.`}
                </Text>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Icon name="add" size={20} color="white" />
                  <Text style={styles.emptyStateButtonText}>Add New Lead</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white'
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  // Fixed headers at the top
  fixedSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fixedStatusFilterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 56, // Fixed height
  },
  // Scrollable content area
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  addLeadButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  // Status Filter Tabs Styles
  statusFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeStatusFilterTab: {
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusFilterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeStatusFilterTabText: {
    fontWeight: '600',
  },
  leadsList: {
    padding: 16,
    backgroundColor: 'white',
    flex: 1,
  },
  leadCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
    marginRight: 4,
  },
  moreButton: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceIcon: {
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkboxContainer: {
    width: 24,
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  emailText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  addedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emailButtonText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
  },
});

export default LeadScreen;