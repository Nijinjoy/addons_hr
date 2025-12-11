import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header';

const AttendanceScreen: React.FC = () => {
  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  return (
    <View style={styles.container}>
      <Header 
        screenName="Attendance" 
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
        notificationCount={2}
        useGradient={true} // or false for solid color
      />
      
      <View style={styles.content}>
        <Text>Attendance Screen Content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AttendanceScreen;