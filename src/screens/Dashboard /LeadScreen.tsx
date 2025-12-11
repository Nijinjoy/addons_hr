import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header'; // adjust path if needed

const LeadScreen = () => {
  const handleNotificationPress = () => {
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="Leads"
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
        notificationCount={2} // optional
      />

      {/* Screen content */}
      <View style={styles.content}>
        <Text style={styles.text}>LeadScreen Content Goes Here</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '500' },
});

export default LeadScreen;
