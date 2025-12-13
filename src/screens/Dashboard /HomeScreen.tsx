import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  // Quick links data
  const quickLinks = [
    { 
      id: 1, 
      title: 'Request Attendance', 
      icon: 'event-note',
      iconType: 'material',
      screen: 'AttendanceRequest'
    },
    { 
      id: 2, 
      title: 'Request a Shift', 
      icon: 'schedule',
      iconType: 'material',
      screen: 'ShiftRequest'
    },
    { 
      id: 3, 
      title: 'Request Leave', 
      icon: 'beach-access',
      iconType: 'material',
      screen: 'LeaveRequest'
    },
    { 
      id: 4, 
      title: 'Claim an Expense', 
      icon: 'receipt',
      iconType: 'material',
      screen: 'ExpenseClaim'
    },
    { 
      id: 5, 
      title: 'Request an Advance', 
      icon: 'attach-money',
      iconType: 'material',
      screen: 'AdvanceRequest'
    },
    { 
      id: 6, 
      title: 'View Salary Slips', 
      icon: 'description',
      iconType: 'material',
      screen: 'SalarySlips'
    },
  ];

  const renderIcon = (iconType: string, iconName: string, size: number = 24, color: string = '#2E8B57') => {
    if (iconType === 'material-community' && MaterialCommunityIcons) {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    }
    return <Icon name={iconName} size={size} color={color} />;
  };

  const handleQuickLinkPress = (screen: string) => {
    console.log(`Navigating to ${screen}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="white" // Changed to white
        translucent={Platform.OS === 'android'}
      />
      
      <Header 
        screenName="ADDONS HR"
        navigation={navigation}
        notificationCount={5}
        useGradient={true}
      />

      {/* White background container below header */}
      <View style={styles.whiteContainer}>
        <ScrollView 
          style={[
            styles.scrollView,
            {
              marginBottom: insets.bottom,
            }
          ]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 16,
            }
          ]}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Hey, Nijin Joy</Text>
            <View style={styles.checkInCard}>
              <View style={styles.checkInHeader}>
                <View style={styles.checkInStatus}>
                  <View style={[styles.statusDot, styles.activeDot]} />
                  <Text style={styles.checkInStatusText}>Checked In</Text>
                </View>
                <TouchableOpacity style={styles.checkOutButton}>
                  <Text style={styles.checkOutButtonText}>Check Out</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.lastCheckInInfo}>
                <Icon name="access-time" size={16} color="#666" />
                <Text style={styles.lastCheckInText}>Last check-in was at 04:42 pm on 3 Dec</Text>
              </View>
              
              <TouchableOpacity style={styles.viewListButton}>
                <Text style={styles.viewListText}>View List</Text>
                <Icon name="chevron-right" size={16} color="#2E8B57" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Links Section */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={styles.quickLinksGrid}>
              {quickLinks.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.quickLinkCard}
                  onPress={() => handleQuickLinkPress(item.screen)}
                >
                  <View style={styles.quickLinkIcon}>
                    {renderIcon(item.iconType, item.icon)}
                  </View>
                  <Text style={styles.quickLinkText}>{item.title}</Text>
                  <Icon name="chevron-right" size={20} color="#999" style={styles.chevronIcon} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional content space */}
          <View style={styles.additionalContent}>
            <Text style={styles.additionalTitle}>Recent Activities</Text>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>No recent activities</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: 'white', // Changed to white
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 16,
    backgroundColor: 'white',
    flexGrow: 1,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  checkInCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  checkInStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checkOutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkOutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  lastCheckInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  lastCheckInText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2E8B57',
    borderRadius: 8,
  },
  viewListText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '600',
    marginRight: 4,
  },
  quickLinksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickLinksGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  chevronIcon: {
    opacity: 0.7,
  },
  additionalContent: {
    marginBottom: 24,
  },
  additionalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  placeholderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});

export default HomeScreen;